require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const accountRouter = require('./routes/accountRouter');
const orderRouter = require('./routes/orderRouter');
const ordersRouter = require('./routes/ordersRouter');
const chatRouter = require('./routes/chatRouter');

const { checkLogin } = require('./middleware/isLoggedIn.js');

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
app.use(checkLogin);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/services', (req, res) => {
    res.render('services', { services: 'selected' });
});

app.get('/helpers', (req, res) => {
    res.render('helpers', { helpers: 'selected' });
});

app.use('/account', accountRouter);
app.use('/order', orderRouter);
app.use('/orders', ordersRouter);
app.use('/offer', ordersRouter);
app.use('/chat', chatRouter);
