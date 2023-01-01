const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        helper: {
            type: Boolean,
            required: true,
        },
        stars: {
            type: Number,
            required: true,
        },
        reviews: {
            type: Number,
            required: true,
        },
        chats: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Account',
            },
        ],
    },
    { timestamps: true }
);

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;
