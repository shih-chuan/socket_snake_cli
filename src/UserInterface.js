const blessed = require('blessed');
const { GRID_SIZE, SNAKE_COLOR, DOT_COLOR } = require('./constants');
class UserInterface {
    constructor() {
        this.blessed = blessed
        this.screen = blessed.screen({
            fastCSR: true
        })

        this.screen.title = '107403551 邱士權'

        this.gameBox = this.createGameBox()
        this.scoreBox = this.createScoreBox()
        this.gameOverBox = this.createGameOverBox()

        this.gameContainer = this.blessed.box(this.gameBox)
        this.scoreContainer = this.blessed.box(this.scoreBox)
    }

    drawSnake(players) {
        Object.keys(players).map((playerId) => {
            let snake = players[playerId].snake;
            snake.forEach(segment => {
                this.draw(segment, SNAKE_COLOR[players[playerId].id])
            })
            return;
        })
    }

    drawDot(dot) {
        this.draw(dot, DOT_COLOR)
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
            content: `{center}Game Over!\n\nPress q to exit{/center}`,
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

    updateScore(score) {
        this.scoreContainer.setLine(0, `{bold}Score:{/bold} ${score}`)
    }

    gameOverScreen() {
        this.gameContainer = this.blessed.box(this.gameOverBox)
    }

    showGameOverScreen() {
        this.gameOverScreen()
        this.render()
    }

    clearScreen() {
        this.gameContainer.detach()
        this.gameContainer = this.blessed.box(this.gameBox)
    }

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