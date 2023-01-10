const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Account = require('../models/account');
const Message = require('../models/message');

const { decodeToken, requireLogin } = require('../middleware/isLoggedIn.js');

const router = express.Router();

router.get('/', requireLogin, async (req, res) => {
    //console.log(req.query.user);
    //get users chats
    //if the user has no chats, show text saying "You have no chats currently"
    //else, send the most recent chat to be opened if there is not a user query
    //get the most recent 25 messages from the chat
    const id = decodeToken(req.cookies.access_token).id;

    let messageLimit = 25;
    if (req.query.limitMessages) {
        messageLimit = req.query.limitMessages;
    }

    let chatters = await Account.findOne(
        { _id: id },
        { chats: 1, _id: 0 }
    ).catch((err) => {
        console.log(err);
    });

    chatters = await chatters
        .populate({
            path: 'chats',
            select: 'username',
        })
        .catch((err) => {
            console.log(err);
        });
    chatters = chatters.chats;

    if (chatters.length > 0) {
        let chatter;
        if (!req.query.user) {
            //there is no user parameter or there is one but you do not have a chat with it
            //get most recent chat
            chatter = await Account.findOne({ _id: chatters[0] }).catch(
                (err) => {
                    console.log(err);
                }
            );
        } else {
            //there is a user parameter
            chatter = await Account.findOne({ _id: req.query.user }).catch(
                (err) => {
                    console.log(err);
                }
            );
        }
        let chats = await Message.find({
            $or: [
                { sender: id, recipient: chatter._id },
                { sender: chatter._id, recipient: id },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(messageLimit)
            .catch((err) => {
                console.log(err);
            });

        chats.reverse();

        Object.keys(chats).forEach(function (key, index) {
            if (chats[key].sender == id) {
                chats[key].sender = 'You';
                chats[key] = {
                    sender: 'You',
                    message: chats[key].message,
                };
            } else {
                chats[key] = {
                    sender: chatter.username,
                    message: chats[key].message,
                };
            }
        });

        res.render('chats', {
            chatters: chatters,
            currentChatter: chatter,
            chats: chats,
            userid: id,
        });
    } else {
        res.render('chats', { chatters: chatters });
    }
});

router.post('/send', bodyParser.json(), async (req, res) => {
    const id = decodeToken(req.cookies.access_token).id;
    let sender = id;
    const { recipient, message } = req.body;

    let recipientUser = await Account.findOne({ _id: recipient }).catch(
        (err) => {
            console.log(err);
        }
    );
    let senderUser = await Account.findOne({ _id: sender }).catch((err) => {
        console.log(err);
    });
    if (!recipientUser.chats.includes(sender)) {
        recipientUser.chats.push(sender);
        await recipientUser.save().catch((err) => {
            console.log(err);
        });
    }
    if (!senderUser.chats.includes(recipient)) {
        senderUser.chats.push(recipient);
        await senderUser.save().catch((err) => {
            console.log(err);
        });
    }

    const messsage = new Message({
        recipient: recipient,
        sender: sender,
        message: message,
    });
    messsage.save().catch((err) => {
        console.log(err);
    });
    //res.redirect(`/chat?user=${id}`);
});

router.get('/newchat', async (req, res) => {
    const sender = decodeToken(req.cookies.access_token).id;
    const recipient = '63927b63fa94e41ab1b09dec';

    let recipientUser = await Account.findOne({ _id: recipient }).catch(
        (err) => {
            console.log(err);
        }
    );
    let senderUser = await Account.findOne({ _id: sender }).catch((err) => {
        console.log(err);
    });
    if (!recipientUser.chats.includes(sender)) {
        recipientUser.chats.push(sender);
        await recipientUser.save().catch((err) => {
            console.log(err);
        });
    }
    if (!senderUser.chats.includes(recipient)) {
        senderUser.chats.push(recipient);
        await senderUser.save().catch((err) => {
            console.log(err);
        });
    }

    res.redirect(`/chat?user=${recipient}`);
});

module.exports = router;
