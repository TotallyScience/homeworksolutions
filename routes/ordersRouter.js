const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');

const { decodeToken } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.get('/', async (req, res) => {
    let id = decodeToken(req.cookies.access_token).id;
    Order.find({ userid: id, open: true }).then((orders) => {
        Order.find({ userid: id, open: false }).then((pastOrders) => {
            res.render('orders', {
                orders: orders,
                pastOrders: pastOrders,
                ordersNav: 'selected',
            });
        });
    });
});

module.exports = router;
