import { useState, useEffect } from 'react';
import { messageAPI } from '../api/messages';
import { useSocket } from '../context/SocketContext';

const Sidebar = ({ selectedUser, onSelectUser }) => {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'search'
  
  const { onlineUsers } = useSocket();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messageAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      setActiveTab('search');
      setLoading(true);
      try {
        const results = await messageAPI.searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
      setLoading(false);
    } else {
      setActiveTab('conversations');
      setSearchResults([]);
    }
  };

  const handleSelectUser = (user) => {
    onSelectUser(user);
    setSearchQuery('');
    setActiveTab('conversations');
    setSearchResults([]);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'search' ? (
          // Search Results
          <div>
            {loading ? (
              <div className="p-4 text-center text-gray-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b transition duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {isUserOnline(user._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No users found</div>
            )}
          </div>
        ) : (
          // Conversations
          <div>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => handleSelectUser(conv.otherUser)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-b transition duration-150 ${
                    selectedUser?._id === conv.otherUser._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {conv.otherUser.username.charAt(0).toUpperCase()}
                      </div>
                      {isUserOnline(conv.otherUser._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conv.otherUser.username}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.updatedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full mt-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-2">No conversations yet</p>
                <p className="text-sm">Search for users to start chatting</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;