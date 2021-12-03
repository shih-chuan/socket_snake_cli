const {
    SNAKE_COLOR,
    DIRECTIONS,
    INITIAL_SNAKE_SIZE,
    DIRECTION_UP,
    DIRECTION_RIGHT,
    DIRECTION_DOWN,
    DIRECTION_LEFT,
    GRID_SIZE
} = require('./constants')

class Game {
    constructor() {
        this.reset();
    }

    reset() {
        // Set up initial state
        this.players = {}
        this.dot = {}
        this.timer = null

        // Generate the first dot before the game begins
        this.generateDot()
    }

    join(client) {
        let snake = [];
        for (let i = INITIAL_SNAKE_SIZE; i >= 0; i--) {
            snake[INITIAL_SNAKE_SIZE - i] = { x: i, y: 5 }
        }
        let usedId = Object.values(this.players).map(player => player.id);
        let newId = 0;
        for(let i=0; i<4; i++){
            if(!usedId.includes(i)){
                newId = i;
                break;
            }
        }
        console.log(newId);
        this.players[client.remotePort] = {
            id: newId,
            snake: snake,
            currentDirection: DIRECTION_RIGHT,
            changingDirection: false,
            score: 0
        };
    }

    changeDirection(key, client) {
        if ((key === DIRECTION_UP || key === 'w') && this.currentDirection !== DIRECTION_DOWN) {
            this.players[client].currentDirection = DIRECTION_UP
        }
        if ((key === DIRECTION_DOWN || key === 's') && this.currentDirection !== DIRECTION_UP) {
            this.players[client].currentDirection = DIRECTION_DOWN
        }
        if ((key === DIRECTION_LEFT || key === 'a') && this.currentDirection !== DIRECTION_RIGHT) {
            this.players[client].currentDirection = DIRECTION_LEFT
        }
        if ((key === DIRECTION_RIGHT || key === 'd') && this.currentDirection !== DIRECTION_LEFT) {
            this.players[client].currentDirection = DIRECTION_RIGHT
        }
    }

    moveSnake() {
        for(let client of Object.keys(this.players)){
            if (this.players[client].changingDirection) {
                return
            }
            this.players[client].changingDirection = true
    
            // Move the head forward by one pixel based on velocity
            let head = {
                x: this.players[client].snake[0].x + DIRECTIONS[this.players[client].currentDirection].x,
                y: this.players[client].snake[0].y + DIRECTIONS[this.players[client].currentDirection].y,
            }
    
            // Left wall
            if (this.players[client].snake[0].x < 0) {
                head.x = head.x + GRID_SIZE;
            }
            // Right wall
            else if (this.players[client].snake[0].x >= GRID_SIZE-1) {
                head.x = 0;
            }
            // Bottom wall
            if (this.players[client].snake[0].y >= GRID_SIZE-1) {
                head.y = 0;
            }
            // Top wall
            else if (this.players[client].snake[0].y < 0) {
                head.y = head.y + GRID_SIZE;
            }
            
            this.players[client].snake.unshift(head)
    
            // If the snake lands on a dot, increase the score and generate a new dot
            if (this.players[client].snake[0].x === this.dot.x && this.players[client].snake[0].y === this.dot.y) {
                this.players[client].score++
                this.generateDot()
            } else {
                // Otherwise, slither
                this.players[client].snake.pop()
            }
        }
    }

    generateRandomPixelCoord(min, max) {
        // Get a random coordinate from 0 to max container height/width
        return Math.floor(Math.random() * (max - min) + min)
    }

    generateDot() {
        // Generate a dot at a random x/y coordinate
        this.dot.x = this.generateRandomPixelCoord(0, GRID_SIZE - 1)
        this.dot.y = this.generateRandomPixelCoord(1, GRID_SIZE - 1)

        let segments = []
        for(let player of Object.values(this.players)){
            segments = segments.concat(player.snake);
        }
        // If the pixel is on a snake, regenerate the dot
        segments.forEach(segment => {
            if (segment.x === this.dot.x && segment.y === this.dot.y) {
                this.generateDot()
            }
        })
    }

    removePlayer(playerId, clients) {
        if(this.players[playerId]){
            delete this.players[playerId];
            console.log('player', playerId, 'deleted');
            for(let i in clients){
                if(+clients[i].remotePort == +playerId){
                    clients[i].write(JSON.stringify({
                        op: 'gameOver',
                        data: {score: '0'}
                    }));
                    clients[i].destroy();
                    clients.splice(i, 1);
                }
            }
        }
    }

    isGameOver(clients) {
        let segments = []
        for(let player of Object.values(this.players)){
            segments = segments.concat(player.snake);
        }

        for(let playerId of Object.keys(this.players)){
            let head = this.players[playerId].snake[0];
            let hits = segments.filter(segment => segment.x === head.x && segment.y === head.y);
            if(hits.length > 1) {
                console.log("hit")
                this.removePlayer(playerId, clients);
                return playerId
            }
        }

        return false;
    }

    quit() {
        process.exit(0)
    }
}

module.exports = { Game }