import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../api/messages';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatWindow = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [selectedUser]);

  // Set up socket listeners - UPDATED VERSION
  useEffect(() => {
    if (!socket || !selectedUser) {
      console.log('⚠️ Socket or selectedUser not available'); // DEBUG
      return;
    }

    console.log('🎧 Setting up socket listeners for:', selectedUser.username); // DEBUG

    // Remove any existing listeners first to prevent duplicates
    socket.off('receive-message');
    socket.off('user-typing');
    socket.off('user-stop-typing');

    // Listen for incoming messages
    const handleReceiveMessage = (message) => {
      console.log('📨 Message received via socket:', message); // DEBUG
      console.log('Message sender ID:', message.sender._id); // DEBUG
      console.log('Selected user ID:', selectedUser._id); // DEBUG
      
      if (message.sender._id === selectedUser._id) {
        console.log('✅ Message is from selected user, adding to state'); // DEBUG
        setMessages((prev) => [...prev, message]);
        markMessagesAsRead();
        scrollToBottom();
      } else {
        console.log('⚠️ Message is NOT from selected user'); // DEBUG
      }
    };

    // Listen for typing indicator
    const handleUserTyping = (data) => {
      console.log('⌨️ Typing event received:', data); // DEBUG
      if (data.userId === selectedUser._id) {
        console.log('✅ Selected user is typing'); // DEBUG
        setIsTyping(true);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    // Listen for stop typing
    const handleUserStopTyping = (data) => {
      console.log('⌨️ Stop typing event:', data); // DEBUG
      if (data.userId === selectedUser._id) {
        setIsTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    // Attach event listeners
    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket listeners'); // DEBUG
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, selectedUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const data = await messageAPI.getMessages(selectedUser._id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
    setLoading(false);
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser) return;
    
    try {
      await messageAPI.markAsRead(selectedUser._id);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || !selectedUser) return;

    console.log('📤 Sending message to:', selectedUser.username); // DEBUG

    try {
      // Send via REST API (saves to database)
      const message = await messageAPI.sendMessage({
        receiverId: selectedUser._id,
        content: content.trim(),
        messageType: 'text'
      });

      console.log('✅ Message saved to database:', message); // DEBUG

      // Add to local state
      setMessages((prev) => [...prev, message]);

      // Send via Socket.IO for real-time delivery
      if (socket) {
        console.log('📡 Emitting message via socket to:', selectedUser._id); // DEBUG
        socket.emit('send-message', {
          receiverId: selectedUser._id,
          message
        });
      } else {
        console.error('❌ Socket not available!'); // DEBUG
      }

      scrollToBottom();
    } catch (error) {
      console.error('❌ Failed to send message:', error); // DEBUG
    }
  };

  const handleTyping = () => {
    if (socket && selectedUser) {
      console.log('⌨️ Emitting typing event to:', selectedUser.username); // DEBUG
      socket.emit('typing', { receiverId: selectedUser._id });
    } else {
      console.log('⚠️ Cannot emit typing - socket or user missing'); // DEBUG
    }
  };

  const handleStopTyping = () => {
    if (socket && selectedUser) {
      console.log('⌨️ Emitting stop-typing event'); // DEBUG
      socket.emit('stop-typing', { receiverId: selectedUser._id });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isUserOnline = () => {
    return selectedUser && onlineUsers.includes(selectedUser._id);
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-12 h-12 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome to ChatFlow
          </h2>
          <p className="text-gray-600">
            Select a conversation or search for users to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>
            {isUserOnline() && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{selectedUser.username}</h2>
            <p className="text-sm text-gray-500">
              {isUserOnline() ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.sender._id === user._id}
              />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{selectedUser.username} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-500">
              <p className="mb-2">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
};

export default ChatWindow;