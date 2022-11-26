require('dotenv').config();
const express = require('express');

const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const account = require('./models/account');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();

//connect to mongodb
const dbURI =
    'mongodb+srv://zach:Homeworksecure4321@homeworksolutions.f1vjlb4.mongodb.net/homeworksolutions?retryWrites=true&w=majority';
mongoose
    .connect(dbURI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'static'), { redirect: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/services', (req, res) => {
    res.render('services');
});

app.get('/order', (req, res) => {
    res.render('order');
});

app.get('/helpers', (req, res) => {
    res.render('helpers');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});
app.post('/signup', bodyParser.urlencoded({ extended: true }), (req, res) => {
    const { email, username, password, confirmPassword } = req.body;

    let error = '';

    if (password.length < 8) {
        error = '*Passwords must be atleast 8 characters';
    } else if (password !== confirmPassword) {
        error = "*Passwords don't match";
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
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', bodyParser.urlencoded({ extended: true }), (req, res) => {
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
                console.log('here');
                if (!user[0]) {
                    res.render('login', {
                        error: error,
                        form: form,
                    });
                } else {
                    if (bcrypt.compareSync(password, user[0].password)) {
                        let token = jwt.sign(
                            { id: account._id },
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

app.get('/orders', (req, res) => {
    res.render('orders');
});

const userRouter = require('./routes/users');
const postRouter = require('./routes/posts');
const Account = require('./models/account');

app.use('/users', userRouter);
app.use('/posts', postRouter);

async function hash(string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(string, salt);
}
