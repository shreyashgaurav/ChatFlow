const express = require('express');
const router = express.Router();
//Importing controllers
const { registerUser, loginUser, logoutUser, getMe } = require('../controllers/authController');
//Importing middlewares
const { protect } = require('../middleware/authMiddleware');

//These are public routes, thus, no authentication needed
router.post('/register', registerUser); //A POST route - used for creating or submitttng data.
router.post('/login', loginUser); //POST also means data sent in the req body


//Protected Routes - aauthetication is required
//"protect" middleware runs first for authentication purposes
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);

module.exports = router;