const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const account = require('./models/account');

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

app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/orders', (req, res) => {
    res.render('orders');
});

const userRouter = require('./routes/users');
const postRouter = require('./routes/posts');

app.use('/users', userRouter);
app.use('/posts', postRouter);
