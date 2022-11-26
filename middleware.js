module.exports = function isLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        // return unauthorized
        res.send(401, 'Unauthorized');
    }
};
