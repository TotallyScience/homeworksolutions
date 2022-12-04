const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema(
    {
        orderid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        offererid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
        },
        amount: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Offer = mongoose.model('Offer', offerSchema);
module.exports = Offer;
