const mongoose = require('mongoose') //This is used to define schema and interact with MongoDB
const bcrypt = require('bcryptjs'); //This is used to hasg password - For Scurity

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true, //MongoDB internally creates an index to enforce this
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long.'],
        maxlength: [20, 'Username cannot exceed 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [8, 'Password must be atleast 8 characters long.'],
        select: false // Because We DO NOT return password by default in DB queries 
        // (Prevents accidental exposure of passwords) - To include password in DB queries use "+"
    },
    avatar: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true //this Automatcally adds two filds(createdAt, updatedAt) to every document
    }
);

//This is a pre-save HOOK (Middleware) - Runs before saving to DB
//Hooks in mongoDb are middlewares that execute before or after an event
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { //Without this the hashed password gets hashed again => USER can not login
        return next();
    }

    const salt = await bcrypt.genSalt(10); //This generates random data (salt)
    //Salt ensures that same password produces different hashes
    //Same salt and Same password will give us the same hashed value => This used for matchng the password 
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

