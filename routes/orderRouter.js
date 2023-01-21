const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const { decodeToken } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('order', { class: req.query.class });
});

router.post(
    '/',
    upload.array('pdf'),
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
        const {
            subject,
            othersubject,
            type,
            size,
            sizeSpecifier,
            spacing,
            deadline,
            instructions,
        } = req.body;
        let id = decodeToken(req.cookies.access_token).id;
        //const buffer = Buffer.from(file.buffer, 'binary');
        //console.log(req.files);
        const className = req.query.class;
        let error = '';

        let yourOrders = await Order.find({ userid: id, completed: false });

        if (yourOrders.length >= 5) {
            error = '*You can only place up to 5 orders';
        } else if (
            subject.length < 1 ||
            type.length < 1 ||
            size.length < 1 ||
            deadline.length < 1 ||
            spacing.length < 1
        ) {
            error = '*You must fill out all details';
        } else if (subject == 'Other' && othersubject == '') {
            error = '*You must specify the subject';
        } else if (req.files.length > 4) {
            error = '*You can only upload up to 4 files';
        } else if (req.files != null) {
            let size = 0;
            req.files.every((file) => {
                if (
                    !file.mimetype.startsWith('image/') &&
                    !(file.mimetype == 'application/pdf')
                ) {
                    error = '*You can only upload Images or PDFs as a file';
                    return false;
                }
                size += file.size;
                return true;
            });
            if (size > 15000000) {
                error = '*Max file upload size is 15 mb';
            }
        }
        if (error != '') {
            const form = {
                subject: subject,
                type: type,
                size: size,
                deadline: deadline,
                instructions: instructions,
                spacing: spacing,
                sizeSpecifier: sizeSpecifier,
            };

            res.render('order', {
                class: className,
                error: error,
                form: form,
                order: 'selected',
            });
        } else {
            if (subject == 'Other' && othersubject != '') {
                var submitSubj = othersubject;
            } else {
                var submitSubj = subject;
            }
            if (sizeSpecifier == 'pages') {
                var submitSpacing = spacing;
            } else {
                var submitSpacing = 'NA';
            }
            let files = req.files.map((file) => file.buffer);
            let fileTypes = req.files.map((file) => file.mimetype);
            const order = new Order({
                userid: id,
                class: submitSubj,
                type: type,
                size: size,
                sizeSpecifier: sizeSpecifier,
                spacing: submitSpacing,
                deadline: deadline,
                instructions: instructions,
                open: true,
                completed: false,
                files: files,
                fileTypes: fileTypes,
                reviewLeft: false,
            });
            order.save().catch((err) => {
                console.log(err);
            });
            res.redirect('/orders');
        }
    }
);

module.exports = router;
