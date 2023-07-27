var io;

module.exports = {
    init: (server) => {
        io = require('socket.io')(server)
        return io
    },
    getIO: () => {
        if(!io) {
            throw new Error('io is not initialized!')
        }
        return io
    }
}