const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');



// sendd Message: Validates anfd creates a new message and updates the conversation

const sendMessage = async (req, res) => {
    try {
        //Extracting data from request body
        const { receiverId, content, messageType, fileUrl, fileName } = req.body;
        const senderId = req.user._id; //From the auth middleware (protect)

        //Validating that receiver ID exixts or Not
        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }
        //Validating that the message has content (Text or File)
        if (!content && !fileUrl) {
            return res.status(400).json({ message: 'content or file is required' });
        }
        //Validating if receiver exists in DB or not
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }


        //Craetring the message and saving it to the DB
        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content,
            messageType: messageType || 'text',
            fileUrl,
            fileName
        });

        //Replacing user IDs with actual user objects
        await message.populate('sender', 'username avatar');
        await message.populate('receiver', 'username avatar');

        //Finding or Creating Converstaions
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        if (!conversation) { //No Convo found
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                lastMessage: message._id,
                unreadCount: {
                    [receiverId]: 1 //New convo, so unreadCount is 1
                }
            });
        } else { //Existing Converstaion founs
            conversation.lastMessage = message._id;

            //Incrementing the current unreadCount by 1
            const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
            conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);

            await conversation.save();
        }
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//this func retrieves convo history b/w two users
const getMessages = async (req, res) => {
    try {
        //get other user's id from url params
        const { userId } = req.params;
        const currentUserId = req.user._id;

        //finding al the messages b/w the two users
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
            .populate('sender', 'username avatar')
            .populate('receiver', 'username avatar')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// getConversations - retireves chat list with last message and unread counts
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        // finding all convos ehere user is a participants
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'username avatar isOnline lastSeen')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        //For Frontend
        const formattedConversations = conversations.map(conv => {
            //finding the other user
            const otherUser = conv.participants.find(
                p => p._id.toString() !== userId.toString()
            );
            //formatted object containing teh convo
            return {
                _id: conv._id,
                otherUser: {
                    _id: otherUser._id,
                    username: otherUser.username,
                    avatar: otherUser.avatar,
                    isOnline: otherUser.isOnline,
                    lastSeen: otherUser.lastSeen
                },
                lastMessage: conv.lastMessage,
                unreadCount: conv.unreadCount.get(userId.toString()) || 0,
                updatedAt: conv.updatedAt
            };
        });
        res.json(formattedConversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const markAsRead = async (req, res) => {
    try {
        //get sender ID from url parameter
        const { userId } = req.params;
        const currentUserId = req.user._id;
        //markin all unread messags from this user as read
        await Message.updateMany({
            sender: userId,
            receiver: currentUserId,
            isRead: false
        },
            {
                isRead: true,
                readAt: new Date()
            }
        );
        //resetting count to 0
        const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, userId] }
        });

        if (conversation) {
            //current user unread count = 0
            conversation.unreadCount.set(currentUserId.toString(), 0);
            await conversation.save();
        }

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//searcing for users by username
const searchUsers = async (req, res) => {
    try {
        //
        const { query } = req.query;
        const currentUserId = req.user._id;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const user = await User.find({
            _id: { $ne: currentUserId },
            username: { $regex: query, $options: 'i' }
        })
            .select('username email avatar isOnline')
            .limit(10);

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    getConversations,
    markAsRead,
    searchUsers
};


/*
sendMessage: Creates new message, updates/creates conversation
getMessages: Retrieves message history between two users
getConversations: Gets all conversations for current user
markAsRead: Marks messages as read and resets unread count
searchUsers: Find users to start new conversations

*/