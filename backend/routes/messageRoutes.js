const express = require('express');
const router = express.Router();

const {
    sendMessage,
    getConversations,
    markAsRead,
    searchUsers,
    getMessages
} = require('../controllers/messageController');

//authentivation middlewares - as all routes require authentication
const { protect } = require('../middleware/authMiddleware');

//Sending a message
router.post('/', protect, sendMessage);

//getting all user convo
router.get('/conversations', protect, getConversations);

//searching for user
router.get('/users/search', protect, searchUsers);

//Getting meessage with specific user
router.get('/:userId', protect, getMessages);

//Marking messages with specific user
router.put('/read/:userId', protect, markAsRead);

module.exports = router;