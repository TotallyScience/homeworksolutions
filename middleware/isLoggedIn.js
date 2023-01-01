const jwt = require('jsonwebtoken');
const Account = require('../models/account.js');

const SECRET = process.env.TOKEN_SECRET;

const decodeToken = (token) => {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
};

const isLoggedIn = async (token, res) => {
    if (!token) return false;
    if (jwt.verify(token, SECRET) == false) return false;
    const id = decodeToken(token).id;
    if (!(await Account.exists({ _id: id }))) {
        if (res != null) {
            res.clearCookie('access_token');
        }
        return false;
    } else {
        await Account.find({ _id: id }).then((user) => {
            res.locals.isHelper = user[0].helper;
        });
    }
    return true;
};

// Middleware for checking if a user is logged in (for navbar and other site related things)
const checkLogin = async (req, res, next) => {
    let token = req.cookies.access_token;

    res.locals.isLoggedIn = await isLoggedIn(token, res);
    next();
};

// Middleware for requiring login on a certain page
const requireLogin = async (req, res, next) => {
    if (!(await isLoggedIn(req.cookies.access_token, res))) {
        return res.redirect('/account/signup');
    }

    next();
};

module.exports = { decodeToken, isLoggedIn, checkLogin, requireLogin };
