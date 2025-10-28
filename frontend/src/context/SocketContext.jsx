import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user?.token) {
      console.log('Connecting socket...'); // DEBUG

      // Close existing connection if any
      if (socketRef.current?.connected) {
        console.log('Closing existing socket connection');
        socketRef.current.close();
      }

      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected! ID:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setConnected(true);
      });

      newSocket.on('online-users', (users) => {
        console.log('Online users:', users);
        setOnlineUsers(users);
      });

      newSocket.on('user-online', ({ userId }) => {
        console.log('User online:', userId);
        setOnlineUsers((prev) => {
          // Prevent duplicates
          if (prev.includes(userId)) {
            return prev;
          }
          return [...prev, userId];
        });
      });

      newSocket.on('user-offline', ({ userId }) => {
        console.log('User offline:', userId);
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Cleanup function
      return () => {
        console.log('Cleaning up socket connection');
        if (newSocket) {
          newSocket.close();
        }
      };
    } else if (!user && socketRef.current) {
      // User logged out
      console.log('User logged out, disconnecting socket');
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setOnlineUsers([]);
    }
  }, [user?.token]); // Only depend on token, not entire user object

  const value = {
    socket,
    onlineUsers,
    connected
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};