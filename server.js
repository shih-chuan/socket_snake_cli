const server = require('net').createServer();
const { Game } = require('./src/Game');
const { FRAME_RATE, PORT } = require("./src/constants");
const { makeId } = require("./src/utils");
const { gameLoop, getUpdatedVelocity, initGame } = require("./game");

const game = null;
const state = {};
const clientRooms = {};

server.on('connection', client => {
    startGameInterval('test1');
    const handleKeydown = (keyCode) => {
        const roomName = clientRooms[client.id];
        if(!roomName){
            return;
        }
        try {
            keyCode = parseInt(keyCode);
        }catch(err){
            console.error(err);
            return;
        }
        const vel = getUpdatedVelocity(keyCode);
        if(vel && state[roomName]) {
            const playerVel = state[roomName].players[client.number - 1].vel;
            if(!(vel.x + playerVel.x == 0 && vel.y + playerVel.y == 0)){
                state[roomName].players[client.number - 1].vel = vel;
            }
        }
    }
    client.on('data', handleKeydown);
});

const emitGameState = (roomName, state) => {
    io.sockets.in(roomName).emit('gameState', JSON.stringify(state));
}

const emitGameOver = (roomName, winner) => {
    io.sockets.in(roomName).emit('gameOver', JSON.stringify({ winner }));
}

const startGameInterval = (roomName) => {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]);
        if(!winner) {
            emitGameState(roomName, state[roomName]);
        }else{
            emitGameOver(roomName, winner);
            state[roomName] = null;
            clearInterval(intervalId);
        }
    }, 1000/FRAME_RATE);
}

server.listen(PORT);
