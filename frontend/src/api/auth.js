import axios from './axios';

export const authAPI = {
    // Register new user
    register: async (userData) => {
        const response = await axios.post('/auth/register', userData);
        return response.data;
    },

    // Login user
    login: async (credentials) => {
        const response = await axios.post('/auth/login', credentials);
        return response.data;
    },

    // Logout user
    logout: async () => {
        const response = await axios.post('/auth/logout');
        return response.data;
    },

    // Get current user
    getMe: async () => {
        const response = await axios.get('/auth/me');
        return response.data;
    }
};