const jwt = require('jsonwebtoken');
const User = require('../models/User');
//protect is the middleware name
const protect = async (req, res, next) => {
    let token;

    if (req.cookies.token) { //if token exists then we are proceeding to verify
        try {
            token = req.cookies.token;
            //verifying token by checvking token signature, checks expiry, decodes payload, return decoded data
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password'); //excluding password as already sutheticated using token
            if (!req.user) {//Token is valid but the user is deleted from the DB
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next(); //Authetication successfull, move to next middleware
        }
        catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, tiken failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };

/*
Tings being done in the above code:
Extcating JWT token
verifying token
finds user from DB - findById
allows access to routes if valid
else returns 401 error

*/