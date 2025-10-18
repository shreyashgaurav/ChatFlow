const mongoose = require('mongoose'); //Iporting the mongoose library

const connectDB = async () => { //Creates an async function as mongoose.connect returns a Promis
    //Try Catch block for graceful error handelling
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
module.exports = connectDB;

/*
What this above code does:
Connects to MongoDB using the connection string (MONGO_URI) from .env
Logs success message


*/