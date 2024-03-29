const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');
const Account = require('../models/account');
const Offer = require('../models/offer');
const Message = require('../models/message');

const { decodeToken } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.post(
    '/',
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
        //get person who offer's id
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

            res.redirect('/orders');
        }
    }
);

router.get('/offers', async (req, res) => {
    if (res.locals.isLoggedIn && res.locals.isHelper) {
        const id = decodeToken(req.cookies.access_token).id;

        let offerOrders = [];
        await Order.find({ open: true }).then(async (orders) => {
            for (let i = 0; i < orders.length; i++) {
                //for each offer id in the document:
                let offered = false;
                let offerid;
                let amount = 0;
                let order = await orders[i].populate('offers').catch((err) => {
                    console.log(err);
                });
                for (let j = 0; j < orders[i].offers.length; j++) {
                    //check if offerer id matches user id
                    if (order.offers[j].offererid == id) {
                        offered = true;
                        amount = order.offers[j].amount;
                        offerid = order.offers[j]._id;
                        break;
                    }
                }
                if (offered) {
                    let user = await Account.find({
                        _id: orders[i].userid,
                    });
                    offerOrders.push({
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
                        amount: amount,
                        offerid: offerid,
                    });
                }
            }
        });

        res.render('offersmade', { orders: offerOrders });
    } else if (!res.locals.isHelper) {
        res.redirect('/');
    } else {
        res.redirect('/account/signup');
    }
});

router.post(
    '/removeoffer',
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
        const userId = decodeToken(req.cookies.access_token).id;
        const { orderId, offerId } = req.body;
        await removeOffer(orderId, offerId);
        res.redirect('/orders/offers');
    }
);

router.post('/offers/declineOffer', bodyParser.json(), async (req, res) => {
    const { offerid, orderid } = req.body;
    await removeOffer(orderid, offerid);
    res.send('success');
});
router.get('/offers/acceptOffer', bodyParser.json(), async (req, res) => {
    const { orderid, helperid, amount } = req.query;
    const id = decodeToken(req.cookies.access_token).id;
    let ordererid = await Order.findOne({ _id: orderid }).catch((err) => {
        console.log(err);
    });
    if (ordererid.userid == id) {
        await Order.updateOne(
            { _id: orderid },
            {
                open: false,
                helperid: helperid,
                price: amount,
            }
        );

        //send message to chatroom that chat started
        if (id.localeCompare(helperid) >= 1) {
            var room = id + helperid;
        } else {
            var room = helperid + id;
        }
        await req.io.to(room).emit('message', `/SERVER/STARTORDER/${orderid}`);

        const messsage = new Message({
            recipient: helperid,
            sender: id,
            message: `/SERVER/STARTORDER/${orderid}`,
        });
        await messsage.save().catch((err) => {
            console.log(err);
        });

        res.redirect(`/chat/newchat?helper=${helperid}`);
    }
});

router.get('/offers/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn && !res.locals.isHelper) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        let offers = [];
        await Order.findOne({ _id: orderid }).then(async (order) => {
            if (order.open != true) {
                res.redirect('/orders');
            }
            order = await order
                .populate({
                    path: 'offers',
                    populate: {
                        path: 'offererid',
                        select: 'stars username reviews completedOrders skills',
                    },
                })
                .catch((err) => {
                    console.log(err);
                });
            //console.log(order.offers[0].offererid.stars);
            for (let i = 0; i < order.offers.length; i++) {
                offers.push({
                    id: order.offers[i]._id,
                    orderid: order.offers[i].orderid,
                    amount: order.offers[i].amount,
                    stars: order.offers[i].offererid.stars,
                    offererName: order.offers[i].offererid.username,
                    offererid: order.offers[i].offererid._id,
                    offererReviews: order.offers[i].offererid.reviews,
                    offererTotalOrders:
                        order.offers[i].offererid.completedOrders,
                    offererSkills: order.offers[i].offererid.skills,
                });
            }
        });

        res.render('seeoffers', { offers: offers, orderid: orderid });
    } else if (res.locals.isHelper) {
        res.redirect('/');
    } else {
        res.redirect('/account/signup');
    }
});

async function removeOffer(orderId, offerId) {
    await Order.updateOne(
        { _id: orderId },
        {
            $pullAll: {
                offers: [{ _id: offerId }],
            },
        }
    );

    await Offer.deleteOne({ _id: orderId });
    return;
}

module.exports = router;
