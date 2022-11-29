const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');

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
                    (acceptedOrders) => {
                        res.render('orders', {
                            orders: orders,
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

module.exports = router;
