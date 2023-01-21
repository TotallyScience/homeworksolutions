require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const accountRouter = require('./routes/accountRouter');
const orderRouter = require('./routes/orderRouter');
const ordersRouter = require('./routes/ordersRouter');
const offersRouter = require('./routes/offersRouter');
const chatRouter = require('./routes/chatRouter');

const { checkLogin, requireLogin } = require('./middleware/isLoggedIn.js');

const app = express();
const http = require('http').Server(app);

const io = require('socket.io')(http);
require('./chatSocket.js').createSocket(io);

app.use(function (req, res, next) {
    req.io = io;
    next();
});

//connect to mongodb
const dbURI =
    'mongodb+srv://zach:Homeworksecure4321@homeworksolutions.f1vjlb4.mongodb.net/homeworksolutions?retryWrites=true&w=majority';
mongoose
    .connect(dbURI)
    .then((result) => http.listen(3000))
    .catch((err) => console.log(err));

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'static'), { redirect: false }));
app.use(cookieParser());
app.use(checkLogin);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/order', requireLogin, (req, res) => {
    res.render('order', { order: 'selected' });
});

app.get('/helpers', (req, res) => {
    res.render('helpers', { helpers: 'selected' });
});

app.use('/account', accountRouter);
app.use('/order', orderRouter);
app.use('/orders', ordersRouter);
app.use('/offer', offersRouter);
app.use('/chat', chatRouter);
