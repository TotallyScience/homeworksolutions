const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send("User list");
});

router.get('/new', (req, res) => {
    res.send("User New Form");
});

router.post('/', (req, res) => {
    res.send("Create User");
});

router
    .route('/:id')
    .get((req, res) => {
        console.log(req.user);
        res.send(`User: ${req.params.id}`);
    })
    .put((req, res) => {
        res.send(`Update User: ${req.params.id}`);
    })
    .delete((req, res) => {
        res.send(`Delete User: ${req.params.id}`);
    })

const users = [{ name: "Kyle" }, { name: "Sally" }];
router.param("id", (req, res, next, id) => { //param runs function whenever there is the specified parameter
    req.user = users[id];
    next();
});

module.exports = router;