const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send("Post list");
});

router.get('/new', (req, res) => {
    res.send("New Post");
});

router.post('/', (req, res) => {
    res.send("Create Post");
});

module.exports = router;