const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');

const { decodeToken } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('order', { class: req.query.class });
});

router.post('/', bodyParser.urlencoded({ extended: true }), (req, res) => {
    const { type, details, size, spacing, deadline, instructions } = req.body;
    const className = req.query.class;
    let error = '';

    if (
        type.length < 1 ||
        details.length < 1 ||
        size.length < 1 ||
        deadline.length < 1 ||
        spacing.length < 1
    ) {
        error = '*You must fill out all details';
    }

    if (error != '') {
        const form = {
            type: type,
            details: details,
            size: size,
            deadline: deadline,
        };

        res.render('order', {
            class: className,
            error: error,
            form: form,
        });
    } else {
        let id = decodeToken(req.cookies.access_token).id;
        const order = new Order({
            userid: id,
            class: className,
            type: type,
            details: details,
            size: size,
            spacing: spacing,
            deadline: deadline,
            instructions: instructions,
            open: true,
        });
        order.save().catch((err) => {
            console.log(err);
        });
        res.redirect('/orders');
    }
});

module.exports = router;
