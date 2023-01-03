function createSocket(httpServer) {
    const io = require('socket.io')(httpServer);

    io.on('connection', (socket) => {
        console.log('here me yell');
        socket.on('join-room', (room) => {
            console.log('bam');
            console.log(room);
            socket.join(room);
        });
        socket.on('send-message', (room, message) => {
            console.log(message);
            socket.to(room).emit('message', message);
            //message is sent do db in different function
        });
    });
}

module.exports = { createSocket };
