const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Account = require('../models/account');

const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post(
    '/signup',
    bodyParser.urlencoded({ extended: true }),
    async (req, res) => {
        const { email, username, password, confirmPassword } = req.body;

        let error = '';

        if (password.length < 8) {
            error = '*Passwords must be atleast 8 characters';
        } else if (password !== confirmPassword) {
            error = "*Passwords don't match";
        } else if (await Account.find({ username: username })) {
            error = '*That username is taken';
        } else if (await Account.find({ email: email })) {
            error = '*That email is taken';
        }

        if (error != '') {
            const form = {
                username: username,
                email: email,
            };

            res.render('signup', {
                error: error,
                form: form,
            });
        } else {
            hash(password).then((pass) => {
                const account = new Account({
                    email: email,
                    username: username,
                    password: pass,
                    helper: false,
                    stars: 0,
                    reviews: 0,
                    completedOrders: 0,
                });
                account
                    .save()
                    .then((result) => {
                        let token = jwt.sign(
                            { id: account._id },
                            process.env.TOKEN_SECRET
                        );
                        return res.cookie('access_token', token).redirect('/');
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            });
        }
    }
);

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', bodyParser.urlencoded({ extended: true }), (req, res) => {
    const { email, password } = req.body;

    const error = '*Incorrect login details';
    const form = {
        email: email,
        password: password,
    };

    if (email.length < 1 || password.length < 1) {
        res.render('login', {
            error: error,
            form: form,
        });
    } else {
        Account.find({ email: email })
            .then((user) => {
                if (!user[0]) {
                    res.render('login', {
                        error: error,
                        form: form,
                    });
                } else {
                    if (bcrypt.compareSync(password, user[0].password)) {
                        let token = jwt.sign(
                            { id: user[0]._id },
                            process.env.TOKEN_SECRET
                        );
                        return res.cookie('access_token', token).redirect('/');
                    } else {
                        res.render('login', {
                            error: error,
                            form: form,
                        });
                    }
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.redirect('/account/signup');
});

async function hash(string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(string, salt);
}

module.exports = router;
