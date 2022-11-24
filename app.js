const express = require('express');
const path = require('path');
const app = express();

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

const userRouter = require('./routes/users');
const postRouter = require('./routes/posts');

app.use('/users', userRouter);
app.use('/posts', postRouter);

app.listen(3000);
