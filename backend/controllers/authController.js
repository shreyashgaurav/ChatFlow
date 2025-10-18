const User = require('../models/User');
const jwt = require('jsonwebtoken');

//Thsi function creates a JSON web Token - JWT for authentication
//The token contains encrypted user ID 
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body; //Extacts data from request body
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const userExists = await User.findOne({
            $or: [{ email }, { username }] //$or is a mongoDB operator that finds document matching any of the condition
        });

        if (userExists) {
            return res.status(400).json({
                message: 'User already exists with this email or username'
            });
        }
        //If input by user is valid and user DNE, then we create the user
        const user = await User.create({
            username,
            email,
            password //This will be atomatically hashed by the pre-save hook in models/Users.js
        });
        //If user created successfully (Can be unsuccessfull as there are constraits applied in Models/User.js and mongoose validates those)
        //Generating token and setting cookies
        if (user) {
            const token = generateToken(user._id);

            res.cookie('token', token, {
                httpOnly: true, //Cookie can not be accessed by JS thus prevents XSS - Cross-Site Scripting attacks
                secure: process.env.NODE_ENV === 'production', //Cookies only sent over HTTP
                sameSite: 'strict', //Cookie only sent from same domain - prevents CSRF (Cross-Site request Forgery attacks)
                maxAge: 30 * 24 * 60 * 60 * 1000 //in millisecond
            });
            res.status(201).json({ //201 => Resource successfullt granted
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                token
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide valid email and password' });
        }
        //Finding users with password and email. +password because in user model "Select: false"
        // "+" means include this field even though select: false
        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.matchPassword(password))) {
            //Login successfill
            const token = generateToken(user._id);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                token
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' }); //Here, we have genric information as error to stop hit and trial by attackers
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const logoutUser = async (req, res) => {
    try {
        res.cookie('token', '', { //After logout setting cookie value to ""
            httpOnly: true,
            expires: new Date(0) //Seting expiray date to jan 1, 1970 (Already expired) 
        });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//To find out where does the req.user comes form and it is being set by the authentication middleware
//Also it returns current logged in user info
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isOnline: user.isOnline
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe
};