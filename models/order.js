const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
    {
        userid: {
            type: String,
            required: true,
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
                helperid: {
                    type: String,
                    required: true,
                },
                description: {
                    type: String,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        helperid: {
            type: String,
            required: false,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
