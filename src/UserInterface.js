const blessed = require('blessed');
const { GRID_SIZE, PORT, HOST } = require('./constants');
var net = require('net');

/**
 * @class UserInterface
 *
 * Interact with the input (keyboard directions) and output (creating screen and
 * drawing pixels to the screen). Currently this class is one hard-coded
 * interface, but could be made into an abstract and extended for multiple
 * interfaces - web, terminal, etc.
 */
class UserInterface {
    constructor() {
        // Blessed is the terminal library API that provides a screen, elements, and
        // event handling
        this.blessed = blessed
        this.screen = blessed.screen({
            fastCSR: true
        })

        // Game title
        this.screen.title = 'Snek.js'

        // Create the boxes
        this.gameBox = this.createGameBox()
        this.scoreBox = this.createScoreBox()
        this.gameOverBox = this.createGameOverBox()

        this.gameContainer = this.blessed.box(this.gameBox)
        this.scoreContainer = this.blessed.box(this.scoreBox)
    }

    openConnection() {
        if(this.client) {
            console.log("--Connection already opened--");
            return;
        }
        //create Socket
        this.client = new net.Socket();
        this.client.on('error', function(err) {
            this.client.destroy();
            this.client = null;
            console.log("ERROR: Connection could not be opened. msg: %s", err.message);
            this.clearScreen();
        })

        //receiving event
        this.client.on('data', function(data) {
            console.log("RECEIVED: %s", data);
        })

        this.client.connect(PORT, HOST, function() {
            console.log("Connection opened successfully");
        })
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

    createGameBox() {
        return {
            parent: this.screen,
            top: 1,
            left: 0,
            width: GRID_SIZE*2,
            height: GRID_SIZE,
            style: {
                fg: 'black',
                bg: '#f0f0f0',
            },
        }
    }

    createScoreBox() {
        return {
            parent: this.screen,
            top: 0,
            left: 'left',
            width: GRID_SIZE*2,
            height: 1,
            tags: true,
            style: {
                fg: 'white',
                bg: 'blue',
            },
        }
    }

    createGameOverBox() {
        return {
            parent: this.screen,
            top: 'center',
            left: 'center',
            width: 20,
            height: 6,
            tags: true,
            valign: 'middle',
            content: `{center}Game Over!\n\nPress enter to try again{/center}`,
            border: {
                type: 'line',
            },
            style: {
                fg: 'black',
                bg: 'magenta',
                border: {
                    fg: '#ffffff',
                },
            },
        }
    }

    bindHandlers(keyPressHandler, quitHandler, enterHandler) {
        // Event to handle keypress i/o
        this.screen.on('keypress', keyPressHandler)
        this.screen.key(['escape', 'q', 'C-c'], quitHandler)
        this.screen.key(['enter'], enterHandler)
    }

    // Draw a pixel
    draw(coord, color) {
        this.blessed.box({
            parent: this.gameContainer,
            top: coord.y,
            left: coord.x*2,
            width: 2,
            height: 1,
            style: {
                fg: color,
                bg: color,
            },
        })
    }

    // Keep track of how many dots have been consumed and write to the score box
    updateScore(score) {
        this.scoreContainer.setLine(0, `{bold}Score:{/bold} ${score}`)
    }

    // BSOD on game over
    gameOverScreen() {
        this.gameContainer = this.blessed.box(this.gameOverBox)
    }

    // Set to initial screen
    clearScreen() {
        this.gameContainer.detach()
        this.gameContainer = this.blessed.box(this.gameBox)
    }

    // Creating a new score box to prevent old snake segments from appearing on it
    resetScore() {
        this.scoreContainer.detach()
        this.scoreContainer = this.blessed.box(this.scoreBox)
        this.updateScore(0)
    }

    render() {
        this.screen.render()
    }
}

module.exports = { UserInterface }