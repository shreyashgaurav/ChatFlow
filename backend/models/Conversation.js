const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        participants: [ //array of users, currently size would be 2, later group chat features to be added
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        lastMessage: { //To get the most recent message in the conversation
            // This will be used to get this: "Last message: 'Hola Amigos'"
            /// Without this we would have to do DB qury
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        unreadCount: {
            type: Map, //Key value pair. key => User Id, values: numbers
            of: Number,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

//Indexing on participants array => Making finding conversations by participants fast 
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
/*
The abobe code does:
tracks convo bw users
"participants": array contains userID => Currently two, later scale it to group chat
"lastMessage": Reference for displaying convo preview (Like in WhatsApp)
unreadCount: tracks unread messag count per user using map
Also have Indexes for fast conversation lookups
*/

/*
Message modl = Individual messages
Conversation model = The chat thread itself including metadata about the conversation

Converstaion model reduces the required number of queries.
If the model was only User model then to get chat List (say last 10 messages) between two users
there would be 10 DB queries

but with conversation modl the number of query would be 1 onlky.
conversations = await Conversation.find(...);

*/