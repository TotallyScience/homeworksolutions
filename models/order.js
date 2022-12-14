const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
    {
        userid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
        },
        class: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        details: {
            type: String,
            required: true,
        },
        size: {
            type: String,
            required: true,
        },
        spacing: {
            type: String,
            required: true,
        },
        deadline: {
            type: String,
            required: true,
        },
        instructions: {
            type: String,
            required: true,
        },
        open: {
            type: Boolean,
            required: true,
        },
        offers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Offer',
            },
        ],

        helperid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
        },
        price: {
            type: String,
        },
        answers: {
            type: String,
        },
        completed: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
