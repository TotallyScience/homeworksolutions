const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');
const Account = require('../models/account');
const Offer = require('../models/offer');

const { decodeToken } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.get('/', async (req, res) => {
    if (res.locals.isLoggedIn) {
        const id = decodeToken(req.cookies.access_token).id;
        if (!res.locals.isHelper) {
            //Regular user
            Order.find({ userid: id, open: true }).then((orders) => {
                Order.find({ userid: id, open: false }).then((pastOrders) => {
                    res.render('orders', {
                        orders: orders,
                        pastOrders: pastOrders,
                        ordersNav: 'selected',
                    });
                });
            });
        } else {
            //Helper

            Order.find({ open: true }).then((orders) => {
                Order.find({ open: false, helperid: id }).then(
                    async (acceptedOrders) => {
                        var acceptedOrderDetails = [];
                        for (let i = 0; i < orders.length; i++) {
                            let user = await Account.find({
                                _id: orders[i].userid,
                            });
                            acceptedOrderDetails.push({
                                id: orders[i]._id,
                                user: user[0].username,
                                class: orders[i].class,
                                type: orders[i].type,
                                details: orders[i].details,
                                size: orders[i].size,
                                spacing: orders[i].spacing,
                                deadline: orders[i].deadline,
                                instructions: orders[i].instructions,
                                open: orders[i].open,
                            });
                        }

                        res.render('orders', {
                            orders: acceptedOrderDetails,
                            acceptedOrders: acceptedOrders,
                            ordersNav: 'selected',
                        });
                    }
                );
            });
        }
    } else {
        res.redirect('/account/signup');
    }
});

router.post(
    '/offer',
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
        //get person who offer's id
        console.log('hi');
        //get amount
        //get id of order
        //update the order with a new array in the offers
        const userId = decodeToken(req.cookies.access_token).id;
        const { amount, orderId } = req.body;

        if (amount == '') {
            res.redirect(`/orders?retrack=true&amount=blank&id=${orderId}`);
        } else {
            let offer = new Offer({
                orderid: orderId,
                offererid: userId,
                amount: amount,
            });
            await offer.save().catch((err) => {
                console.log(err);
            });

            let order = await Order.findOne({ _id: orderId }).catch((err) => {
                console.log(err);
            });
            order.offers.push(offer._id);
            await order.save().catch((err) => {
                console.log(err);
            });
            await order.populate('offers').catch((err) => {
                console.log(err);
            });

            res.redirect('/orders');
        }
    }
);

module.exports = router;
