const rooms = {};

function createRoom(socketId) {

    const roomId = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();

    rooms[roomId] = {
        players: [socketId]
    };

    return roomId;
}


function joinRoom(roomId, socketId) {

    const room = rooms[roomId];

    if (!room) {
        return false;
    }

    if (room.players.length >= 2) {
        return false;
    }

    room.players.push(socketId);

    return true;
}


function getRoom(roomId) {
    return rooms[roomId];
}


module.exports = {
    createRoom,
    joinRoom,
    getRoom
};