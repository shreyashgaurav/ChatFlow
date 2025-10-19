const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId, //mongoose.Schema.Types.ObjectId => Special MongoDB data type for IDs
            //Like a foriegn key in SQL DB
            ref: 'User', //References the user model
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            trim: true
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'file'], //Only these kind of messages allowed
            default: 'text'
        },
        fileUrl: {
            type: String,
            default: false
        },
        isRead: {
            type: Boolean,
            default: null
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true //Automatically adds createdAt and updatedAt
    }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1});
/*indexing is implmented in line number 43:

1 = Ascending Order
-1 = Descending Order
sender: 1 => Index Sender ascending order
receiver: 1 => Index receiver in ascending order
createdAt: -1 => Index createdAt in descending order

optimizes to get the newest message first


*/
module.exports = mongoose.model('Message', messageSchema);