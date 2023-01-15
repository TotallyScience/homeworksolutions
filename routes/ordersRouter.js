const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Order = require('../models/order');
const Account = require('../models/account');
const Message = require('../models/message');
const Offer = require('../models/offer');
const fs = require('fs');
const archiver = require('archiver');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const { decodeToken } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.get('/', async (req, res) => {
    if (res.locals.isLoggedIn) {
        const id = decodeToken(req.cookies.access_token).id;
        if (!res.locals.isHelper) {
            //Regular user
            Order.find({ userid: id, completed: false }).then(
                async (orders) => {
                    for (let i = 0; i < orders.length; i++) {
                        orders[i] = await orders[i]
                            .populate({
                                path: 'helperid',
                                select: 'stars username',
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    }
                    Order.find({ userid: id, completed: true }).then(
                        (pastOrders) => {
                            res.render('client/orders', {
                                orders: orders,
                                pastOrders: pastOrders,
                                ordersNav: 'selected',
                            });
                        }
                    );
                }
            );
        } else {
            //Helper
            var acceptedOrderDetails = [];

            await Order.find({ open: true }).then(async (orders) => {
                for (let i = 0; i < orders.length; i++) {
                    //for each offer id in the document:
                    let offered = false;
                    let order = await orders[i]
                        .populate('offers')
                        .catch((err) => {
                            console.log(err);
                        });
                    for (let j = 0; j < orders[i].offers.length; j++) {
                        //check if offerer id matches user id
                        if (order.offers[j].offererid == id) {
                            offered = true;
                        }
                    }
                    if (!offered) {
                        let user = await Account.find({
                            _id: orders[i].userid,
                        });
                        acceptedOrderDetails.push({
                            id: orders[i]._id,
                            user: user[0].username,
                            class: orders[i].class,
                            type: orders[i].type,
                            details: orders[i].details,
                            size: orders[i].size,
                            spacing: orders[i].spacing,
                            deadline: orders[i].deadline,
                            instructions: orders[i].instructions,
                            open: orders[i].open,
                            files: orders[i].files.length,
                            helperCompletedDate: orders[i].helperCompletedDate,
                        });
                    }
                }
            });
            let acceptedOrders = await Order.find({
                open: false,
                helperid: id,
                completed: false,
            });

            for (let i = 0; i < acceptedOrders.length; i++) {
                acceptedOrders[i] = await acceptedOrders[i]
                    .populate('userid')
                    .catch((err) => {
                        console.log(err);
                    });
            }

            res.render('helper/orders', {
                orders: acceptedOrderDetails,
                acceptedOrders: acceptedOrders,
                ordersNav: 'selected',
            });
        }
    } else {
        res.redirect('/account/signup');
    }
});

router.get('/deleteall', async (req, res) => {
    await Offer.deleteMany({});
    await Order.deleteMany({});
    res.redirect('/orders');
});

router.get('/activeorder/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn && res.locals.isHelper) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        await Order.findOne({ _id: orderid }).then(async (order) => {
            if (order.open == true || order.helperid != id) {
                res.redirect('/orders');
            }
            order = await order.populate('userid');
            res.render('helper/activeorder', { order: order });
        });
    } else if (!res.locals.isHelper) {
        res.redirect('/');
    } else {
        res.redirect('/account/signup');
    }
});

router.get('/completedorder/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn && !res.locals.isHelper) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        await Order.findOne({ _id: orderid }).then(async (order) => {
            if (
                order.open == true ||
                order.completed == false ||
                order.userid != id
            ) {
                res.redirect('/orders');
            }
            order = await order.populate('helperid');
            res.render('helper/activeorder', { order: order });
        });
    } else if (res.locals.isHelper) {
        res.redirect('/orders');
    } else {
        res.redirect('/account/signup');
    }
});

router.get('/downloadfiles/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        await Order.findOne({ _id: orderid })
            .select('files fileTypes')
            .then(async (order) => {
                //console.log(order.files);

                const files = order.files;

                const zip = archiver('zip');

                res.attachment('files.zip');
                zip.pipe(res);

                for (let i = 0; i < files.length; i++) {
                    let extension = order.fileTypes[i].split('/')[1];
                    zip.append(files[i], {
                        name: `file-${Date.now()}.${extension}`,
                    });
                }
                zip.finalize();
            });
    } else {
        res.redirect('/account/signup');
    }
});

router.get('/downloadfiles/submitted/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn) {
        const id = decodeToken(req.cookies.access_token).id;
        let orderid = req.params.orderid;

        await Order.findOne({ _id: orderid })
            .select('submittedFiles submittedFileTypes userid')
            .then(async (order) => {
                //console.log(order.files);

                const userid = order.userid;

                const files = order.submittedFiles;

                const zip = archiver('zip');

                res.attachment('files.zip');
                zip.pipe(res);

                for (let i = 0; i < files.length; i++) {
                    let extension = order.submittedFileTypes[i].split('/')[1];
                    zip.append(files[i], {
                        name: `file-${Date.now()}.${extension}`,
                    });
                }
                zip.finalize();
            });
    } else {
        res.redirect('/account/signup');
    }
});

router.post(
    '/submitFiles',
    upload.array('pdf'),
    bodyParser.urlencoded({ extended: true }),
    (req, res) => {
        const id = decodeToken(req.cookies.access_token).id;
        const { orderid, userid } = req.body;
        //const buffer = Buffer.from(file.buffer, 'binary');
        //console.log(req.files);
        const className = req.query.class;
        let error = '';

        if (req.files.length > 4) {
            error = '*You can only upload up to 4 files';
        } else if (req.files != null) {
            let size = 0;
            req.files.every((file) => {
                if (
                    !file.mimetype.startsWith('image/') &&
                    !(file.mimetype == 'application/pdf')
                ) {
                    error = '*You can only upload Images or PDFs as a file';
                    return false;
                }
                size += file.size;
                return true;
            });
            if (size > 15000000) {
                error = '*Max file upload size is 15 mb';
            }
        }
        if (error != '') {
            res.redirect(`/orders?submitError=${error}`);
        } else {
            let files = req.files.map((file) => file.buffer);
            let fileTypes = req.files.map((file) => file.mimetype);
            //let id = decodeToken(req.cookies.access_token).id;
            console.log(orderid);
            Order.updateOne(
                { _id: orderid },
                {
                    submittedFiles: files,
                    submittedFileTypes: fileTypes,
                }
            ).then(async (order) => {
                //send message to the chat
                console.log(userid.trim());
                if (id.localeCompare(userid) >= 1) {
                    var room = id + userid;
                } else {
                    var room = userid + id;
                }
                console.log(room);
                await req.io.to(room).emit('message', `/SERVER/${orderid}`);

                const messsage = new Message({
                    recipient: userid,
                    sender: id,
                    message: `/SERVER/${orderid}`,
                });
                await messsage.save().catch((err) => {
                    console.log(err);
                });
                res.redirect('/orders');
            });
        }
    }
);

router.get('/completeOrder/:orderid', async (req, res) => {
    if (res.locals.isLoggedIn) {
        const id = decodeToken(req.cookies.access_token).id;
        const orderid = req.params.orderid;

        if (!res.locals.isHelper) {
            //client finish order
            await Order.updateOne(
                { _id: orderid },
                {
                    completed: true,
                }
            );

            const order = await Order.findOne({ _id: orderid }).select(
                'helperid'
            );

            if (id.localeCompare(order.helperid) >= 1) {
                var room = id + order.helperid;
            } else {
                var room = order.helperid + id;
            }

            await req.io
                .to(room)
                .emit('message', `/SERVER/CLIENTCOMPLETE/${orderid}`);
            await req.io.to(room).emit('message', `/SERVER/REVIEW/`);

            const messsage = new Message({
                recipient: order.helperid,
                sender: id,
                message: `/SERVER/CLIENTCOMPLETE/${orderid}`,
            });
            await messsage.save().catch((err) => {
                console.log(err);
            });
            const reviewMesssage = new Message({
                recipient: order.helperid,
                sender: id,
                message: `/SERVER/REVIEW/`,
            });
            await reviewMesssage.save().catch((err) => {
                console.log(err);
            });

            res.redirect(`/chat?user=${order.helperid}`);
        } else {
            //helper finish order
            await Order.updateOne(
                { _id: orderid },
                {
                    helperCompletedDate: new Date(),
                }
            );

            const order = await Order.findOne({ _id: orderid }).select(
                'userid'
            );

            if (id.localeCompare(order.userid) >= 1) {
                var room = id + order.userid;
            } else {
                var room = order.userid + id;
            }

            await req.io
                .to(room)
                .emit('message', `/SERVER/HELPERCOMPLETE/${orderid}`);

            const messsage = new Message({
                recipient: order.userid,
                sender: id,
                message: `/SERVER/HELPERCOMPLETE/${orderid}`,
            });
            await messsage.save().catch((err) => {
                console.log(err);
            });

            const hours48 = 48 * 60 * 60 * 1000; //in ms
            //const hours48 = 5000; //in ms
            // Set a timer for 48 hours in the future
            setTimeout(async () => {
                //console.log('Executing');
                // Check if the request has been declined
                const order = await Order.findOne({ _id: orderid }).select(
                    'helperCompletedDate'
                );

                if (new Date() - order.helperCompletedDate >= hours48) {
                    // Call the function if the request has not been declined
                    await Order.updateOne(
                        { _id: orderid },
                        {
                            completed: true,
                        }
                    );

                    //send complete message
                    await Order.updateOne(
                        { _id: orderid },
                        {
                            completed: true,
                        }
                    );

                    const order = await Order.findOne({ _id: orderid }).select(
                        'helperid'
                    );

                    if (id.localeCompare(order.helperid) >= 1) {
                        var room = id + order.helperid;
                    } else {
                        var room = order.helperid + id;
                    }

                    await req.io
                        .to(room)
                        .emit('message', `/SERVER/CLIENTCOMPLETE/${orderid}`);

                    const messsage = new Message({
                        recipient: order.helperid,
                        sender: id,
                        message: `/SERVER/CLIENTCOMPLETE/${orderid}`,
                    });
                    await messsage.save().catch((err) => {
                        console.log(err);
                    });
                }
            }, hours48);
            res.redirect(`/chat?user=${order.userid}`);
        }
    } else {
        res.redirect('/account/signup');
    }
});

router.get('/completeOrder/cancel/:orderid', async (req, res) => {
    const id = decodeToken(req.cookies.access_token).id;
    const orderid = req.params.orderid;
    if (res.locals.isHelper) {
        await Order.updateOne(
            { _id: orderid },
            {
                helperCompletedDate: '',
            }
        );

        const order = await Order.findOne({ _id: orderid }).select('userid');

        if (id.localeCompare(order.userid) >= 1) {
            var room = id + order.userid;
        } else {
            var room = order.userid + id;
        }

        await req.io
            .to(room)
            .emit('message', `/SERVER/CANCELCOMPLETE/${orderid}`);

        const messsage = new Message({
            recipient: order.userid,
            sender: id,
            message: `/SERVER/CANCELCOMPLETE/${orderid}`,
        });
        await messsage.save().catch((err) => {
            console.log(err);
        });

        res.redirect(`/chat?user=${order.userid}`);
    } else if (res.locals.isLoggedIn) {
        await Order.updateOne(
            { _id: orderid },
            {
                helperCompletedDate: '',
            }
        );

        const order = await Order.findOne({ _id: orderid }).select('helperid');

        if (id.localeCompare(order.helperid) >= 1) {
            var room = id + order.helperid;
        } else {
            var room = order.helperid + id;
        }

        await req.io
            .to(room)
            .emit('message', `/SERVER/CANCELCOMPLETE/${orderid}`);

        const messsage = new Message({
            recipient: order.helperid,
            sender: id,
            message: `/SERVER/CANCELCOMPLETE/${orderid}`,
        });
        await messsage.save().catch((err) => {
            console.log(err);
        });
        res.redirect(`/chat?user=${order.helperid}`);
    } else {
        res.redirect('/account/signup');
    }
});

module.exports = router;
