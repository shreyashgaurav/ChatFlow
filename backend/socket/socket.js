const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

// Store online users: { userId: socketId }
const onlineUsers = new Map();

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true
        }
    });

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user to socket
            socket.userId = user._id.toString();
            socket.username = user.username;

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Handle connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.username} (${socket.userId})`);

        // Add user to online users
        onlineUsers.set(socket.userId, socket.id);

        // Update user status to online
        User.findByIdAndUpdate(socket.userId, {
            isOnline: true,
            lastSeen: new Date()
        }).exec();

        // Broadcast to all users that this user is online
        socket.broadcast.emit('user-online', {
            userId: socket.userId,
            username: socket.username
        });

        // Join user to their own room (for private messages)
        socket.join(socket.userId);

        // Send list of online users to the connected user
        socket.emit('online-users', Array.from(onlineUsers.keys()));

        // Handle private messages
        socket.on('send-message', async (data) => {
            const { receiverId, message } = data;

            // Send message to receiver if they're online
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive-message', {
                    ...message,
                    sender: {
                        _id: socket.userId,
                        username: socket.username
                    }
                });
            }

            // Also send acknowledgment back to sender
            socket.emit('message-sent', message);
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user-typing', {
                    userId: socket.userId,
                    username: socket.username
                });
            }
        });

        // Handle stop typing
        socket.on('stop-typing', (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user-stop-typing', {
                    userId: socket.userId
                });
            }
        });

        // Handle message read
        socket.on('message-read', (data) => {
            const { senderId, messageIds } = data;
            const senderSocketId = onlineUsers.get(senderId);

            if (senderSocketId) {
                io.to(senderSocketId).emit('messages-read', {
                    readBy: socket.userId,
                    messageIds
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username} (${socket.userId})`);

            // Remove from online users
            onlineUsers.delete(socket.userId);

            // Update user status to offline
            User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen: new Date()
            }).exec();

            // Broadcast to all users that this user is offline
            socket.broadcast.emit('user-offline', {
                userId: socket.userId
            });
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initializeSocket, getIO };