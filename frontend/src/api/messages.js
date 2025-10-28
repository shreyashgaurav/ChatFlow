import axios from './axios';

export const messageAPI = {
    // Get all conversations
    getConversations: async () => {
        const response = await axios.get('/messages/conversations');
        return response.data;
    },

    // Get messages with specific user
    getMessages: async (userId) => {
        const response = await axios.get(`/messages/${userId}`);
        return response.data;
    },

    // Send message
    sendMessage: async (messageData) => {
        const response = await axios.post('/messages', messageData);
        return response.data;
    },

    // Mark messages as read
    markAsRead: async (userId) => {
        const response = await axios.put(`/messages/read/${userId}`);
        return response.data;
    },

    // Search users
    searchUsers: async (query) => {
        const response = await axios.get(`/messages/users/search?query=${query}`);
        return response.data;
    }
};