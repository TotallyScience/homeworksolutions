function createSocket(io) {
    //const io = require('socket.io')(httpServer);

    io.on('connection', (socket) => {
        socket.on('join-room', (room) => {
            socket.join(room);
        });
        socket.on('send-message', (room, message) => {
            socket.to(room).emit('message', message);
            //message is sent do db in different function
        });
    });
}

module.exports = { createSocket };
