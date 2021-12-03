#!/usr/bin/env node
var net = require('net');
const { UserInterface } = require('./src/UserInterface');
const { PORT, HOST } = require('./src/constants');
class Client {
    constructor() {
        this.ui = new UserInterface();
        this.openConnection();
    }

    openConnection() {
        let _this = this;
        if(this.client) {
            console.log("--Connection already opened--");
            return;
        }
        //create Socket
        this.client = new net.Socket();
        this.client.on('error', function(err) {
            _this.client = null;
            console.log("ERROR: Connection could not be opened. msg: %s", err.message);
            _this.ui.clearScreen();
        })

        console.log('client端：向 server端 請求連線')
        //receiving event
        this.client.on('data', function(payload) {
            payload = JSON.parse(payload);
            let op = payload.op;
            let data = payload.data;
            switch(op){
                case 'gameLoop': 
                    _this.ui.clearScreen();
                    _this.ui.updateScore(data.players[_this.client.localPort].score);
                    _this.ui.drawSnake(data.players);
                    _this.ui.drawDot(data.dot);
                    _this.ui.render();
                    break;
                case 'gameOver':
                    _this.ui.showGameOverScreen();
            }
        })

        this.client.connect(PORT, HOST, function() {
            console.log("Connection opened successfully");
            _this.ui.render();
            _this.bindHandlers();
        })
    }

    bindHandlers() {
        // Event to handle keypress i/o
        this.ui.screen.on('keypress', (_, key) => {
            this.sendData(key.name);
        });
        this.ui.screen.key(['escape', 'q', 'C-c', 'enter'], () => {
            process.exit();
        });
    }

    sendData(data) {
        if(!this.client){
            console.log("--Connection is not opened or closed --");
            return;
        }
        this.client.write(data);
    }

    closeConnection() {
        if(!this.client){
            console.log("--Connection is not opened or already closed --");
            return;
        }
        this.client.destroy();
        this.client = null;
        console.log("--Connection closed successfully--");
        this.clearScreen();
    }
}

new Client();