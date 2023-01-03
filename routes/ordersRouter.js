const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');
const Account = require('../models/account');
const Offer = require('../models/offer');
const fs = require('fs');
const archiver = require('archiver');

const { decodeToken } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.get('/', async (req, res) => {
    if (res.locals.isLoggedIn) {
        const id = decodeToken(req.cookies.access_token).id;
        if (!res.locals.isHelper) {
            //Regular user
            Order.find({ userid: id, completed: false }).then(
                async (orders) => {
                    for (let i = 0; i < orders.length; i++) {
                        orders[i] = await orders[i]
                            .populate({
                                path: 'helperid',
                                select: 'stars username',
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    }
                    Order.find({ userid: id, completed: true }).then(
                        (pastOrders) => {
                            res.render('client/orders', {
                                orders: orders,
                                pastOrders: pastOrders,
                                ordersNav: 'selected',
                            });
                        }
                    );
                }
            );
        } else {
            //Helper
            var acceptedOrderDetails = [];

            await Order.find({ open: true }).then(async (orders) => {
                for (let i = 0; i < orders.length; i++) {
                    //for each offer id in the document:
                    let offered = false;
                    let order = await orders[i]
                        .populate('offers')
                        .catch((err) => {
                            console.log(err);
                        });
                    for (let j = 0; j < orders[i].offers.length; j++) {
                        //check if offerer id matches user id
                        if (order.offers[j].offererid == id) {
                            offered = true;
                        }
                    }
                    if (!offered) {
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
                            files: orders[i].files.length,
                        });
                    }
                }
            });
            let acceptedOrders = await Order.find({
                open: false,
                helperid: id,
                completed: false,
            });
            res.render('helper/orders', {
                orders: acceptedOrderDetails,
                acceptedOrders: acceptedOrders,
                ordersNav: 'selected',
            });
        }
    } else {
        res.redirect('/account/signup');
    }
});

router.get('/deleteall', async (req, res) => {
    await Offer.deleteMany({});
    await Order.deleteMany({});
    res.redirect('/orders');
});

router.get('/activeorder/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn && res.locals.isHelper) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        await Order.findOne({ _id: orderid }).then(async (order) => {
            if (order.open == true || order.helperid != id) {
                res.redirect('/orders');
            }
            order = await order.populate('userid');
            res.render('helper/activeorder', { order: order });
        });
    } else if (!res.locals.isHelper) {
        res.redirect('/');
    } else {
        res.redirect('/account/signup');
    }
});

router.post(
    '/activeorder/:orderid',
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
        if (res.locals.isLoggedIn && res.locals.isHelper) {
            const id = decodeToken(req.cookies.access_token).id;
            let orderid = req.params.orderid;
            console.log(req.body);
            await Order.updateOne(
                { _id: orderid },
                {
                    completed: true,
                    answers: req.body.answers,
                }
            ).then(async (order) => {
                res.redirect('/orders');
            });
        } else if (!res.locals.isHelper) {
            res.redirect('/');
        } else {
            res.redirect('/account/signup');
        }
    }
);

router.get('/completedorder/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn && !res.locals.isHelper) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        await Order.findOne({ _id: orderid }).then(async (order) => {
            if (
                order.open == true ||
                order.completed == false ||
                order.userid != id
            ) {
                res.redirect('/orders');
            }
            order = await order.populate('helperid');
            res.render('helper/activeorder', { order: order });
        });
    } else if (res.locals.isHelper) {
        res.redirect('/orders');
    } else {
        res.redirect('/account/signup');
    }
});

router.get('/downloadfiles/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        await Order.findOne({ _id: orderid })
            .select('files fileTypes')
            .then(async (order) => {
                //console.log(order.files);

                const files = order.files;

                const zip = archiver('zip');

                res.attachment('files.zip');
                zip.pipe(res);

                for (let i = 0; i < files.length; i++) {
                    let extension = order.fileTypes[i].split('/')[1];
                    console.log(extension);
                    zip.append(files[i], {
                        name: `file-${Date.now()}.${extension}`,
                    });
                }
                zip.finalize();
            });
    } else {
        res.redirect('/account/signup');
    }
});

module.exports = router;
