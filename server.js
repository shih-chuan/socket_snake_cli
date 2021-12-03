const server = require('net').createServer();
const { Game } = require('./src/Game');
const { PORT, GAME_SPEED } = require("./src/constants");

let game = null;
let clients = [];

server.on('connection', client => {
    const remoteAddress = `${client.remoteAddress}:${client.remotePort}`
    console.log(`new client connection is made.`, remoteAddress);
    if(!game){
        game = new Game();
        startGameInterval();
    }
    game.join(client);
    clients.push(client);
    client.on('data', (data) => {
        data = data.toString();
        switch(data){
            case 'enter':
                startGameInterval(client);
                break;
            default:
                game.changeDirection(data, client.remotePort);
        }
    });

    //只會觸發一次用once
    client.once('close', () => {
        client.destroy();
        game.removePlayer(client.remotePort, clients);
        console.log("connection from %s closed", remoteAddress);
    })

    client.on('end', () => {
        client.destroy();
        game.removePlayer(client.remotePort, clients);
        console.log("connection %s end", remoteAddress);
    })

    client.on('error', (err) => {
        game.removePlayer(client.remotePort, clients);
        client.destroy();
        console.log("connection %s error: %s", remoteAddress, err.message);
    })
});

const startGameInterval = function() {
    if (!game.timer) {
        game.reset();

        game.timer = setInterval(function() {
            if (game.players.length <= 0) {
                return
            }

            game.isGameOver(clients);

            for(let playerId of Object.keys(game.players)){
                game.players[playerId].changingDirection = false;
            }

            for(let client of clients){
                client.write(JSON.stringify({
                    op: 'gameLoop',
                    data: {
                        players: game.players,
                        dot: game.dot,
                        score: game.score
                    }
                }));
            }
            game.moveSnake()
        }, GAME_SPEED)
    }
}

server.listen({
    port: PORT, 
    backlog: 4
}, console.log("listening to port", PORT));
