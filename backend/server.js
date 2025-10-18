const express = require('express'); // Is a framework. All the below ones are middlewares
const dotenv = require('dotenv'); //This is used to load environment variables from .env file
const cors = require('cors'); //CORS => Cross-Origin Resource Sharing : A middleware that allows the frontend to talk to the backend
const cookieParser = require('cookie-parser'); //Parse cookies from HTTP requests
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(express.json()); //Middle ware for parsing json
app.use(cookieParser()); //Middleware for parsing cookies
app.use(cors({
    origin: 'http://localhost:5173', //Front-end Connection is allowed (Cors helps in that - See Notes)
    credentials: true //Allows cookies to be sent. Also, needed for JWT athentication with cookies
}));


//Routes
app.use('/api/auth', require('./routes/authRoutes'));


//Jst for testing
app.get('/', (req, res) => {
    res.send('ChatFlow API is working.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running at the PORT ${PORT}`);
});


/*
Wht the above code does?
Loads environmnt variable
Connects to MongoDB
Sets up Express with the necessary middlewares
Creates a test route
starts a server

*/