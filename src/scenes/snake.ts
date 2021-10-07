import { Scene, Types, Geom, GameObjects, Math, Actions } from 'phaser';

enum Direction {
    Up = 0,
    Down = 1,
    Left = 2,
    Right = 3,
}

class Snake {
    headPosition: Geom.Point;
    body: GameObjects.Group;
    head: any;
    tail: Geom.Point;
    alive: boolean;
    speed: number;
    moveTime: number;
    heading: Direction;
    direction: Direction;

    constructor(scene: Scene, x, y) {
        this.headPosition = new Geom.Point(x, y);
        this.body = scene.add.group();

        this.head = this.body.create(x * 16, y * 16, 'body');
        this.head.setOrigin(0);

        this.alive = true;

        this.speed = 100;

        this.moveTime = 0;

        this.tail = new Geom.Point(x, y);

        this.heading = Direction.Right;
        this.direction = Direction.Right;
    }

    update(time: number) {
        if (time > this.moveTime) {
            return this.move(time);
        }
    }

    move(time: number) {
        const { headPosition, body, head, heading } = this;

        /**
         * Based on the heading property (which is the direction the group pressed)
         * we update the headPosition value accordingly.
         *
         * The Math.wrap call allow the snake to wrap around the screen, so when
         * it goes off any of the sides it re-appears on the other.
         */
        switch (heading) {
            case Direction.Left:
                headPosition.x = Math.Wrap(headPosition.x - 1, 0, 50);
                break;

            case Direction.Right:
                headPosition.x = Math.Wrap(headPosition.x + 1, 0, 50);
                break;

            case Direction.Up:
                headPosition.y = Math.Wrap(headPosition.y - 1, 0, 40);
                break;

            case Direction.Down:
                headPosition.y = Math.Wrap(headPosition.y + 1, 0, 40);
                break;
        }

        this.direction = heading;

        let vector = new Math.Vector2(0, 0);
        Actions.ShiftPosition(
            body.getChildren(),
            headPosition.x * 16,
            headPosition.y * 16,
            1,
            vector
        );
        this.tail.x = vector.x;
        this.tail.y = vector.y;

        const hitBody = Actions.GetFirst(
            this.body.getChildren(),
            {
                x: head.x,
                y: head.y,
            },
            1
        );

        if (hitBody) {
            this.alive = false;
            return false;
        } else {
            this.moveTime = time + this.speed;

            return true;
        }
    }

    faceLeft() {
        if (
            this.direction === Direction.Up ||
            this.direction === Direction.Down
        ) {
            this.heading = Direction.Left;
        }
    }

    faceRight() {
        if (
            this.direction === Direction.Up ||
            this.direction === Direction.Down
        ) {
            this.heading = Direction.Right;
        }
    }

    faceUp() {
        if (
            this.direction === Direction.Left ||
            this.direction === Direction.Right
        ) {
            this.heading = Direction.Up;
        }
    }

    faceDown() {
        if (
            this.direction === Direction.Left ||
            this.direction === Direction.Right
        ) {
            this.heading = Direction.Down;
        }
    }

    grow() {
        const { tail } = this;

        let newPart = this.body.create(tail.x, tail.y, 'body');
        newPart.setOrigin(0);
    }

    collideWithFood(food: Food) {
        if (this.head.x === food.x && this.head.y === food.y) {
            this.grow();

            food.eat();

            if (this.speed > 20 && food.total % 5 === 0) {
                this.speed -= 5;
            }

            return true;
        }
        return false;
    }

    updateGrid(grid) {
        this.body.children.each((segment: any) => {
            let x = segment.x / 16;
            let y = segment.y / 16;
            grid[y][x] = false;
        });

        return grid;
    }
}

class Food extends GameObjects.Image {
    total: number;

    constructor(scene: Scene, x, y) {
        super(scene, x * 16, y * 16, 'food');

        this.setOrigin(0);

        scene.children.add(this);

        this.total = 0;
    }

    eat() {
        this.total++;
    }
}

function repositionFood(snake: Snake, food: Food) {
    let testGrid = [];

    for (let y = 0; y < 40; y++) {
        testGrid[y] = [];

        for (let x = 0; x < 50; x++) {
            testGrid[y][x] = true;
        }
    }

    snake.updateGrid(testGrid);

    let validLocations = [];
    for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 50; x++) {
            if (testGrid[y][x]) {
                validLocations.push({ x, y });
            }
        }
    }

    if (validLocations.length) {
        let position = Math.RND.pick(validLocations);
        food.setPosition(position.x * 16, position.y * 16);
        return true;
    }

    return false;
}

// TODO: add bomb
// class Bomb {
//     group: Physics.Arcade.Group;
//     constructor(scene: Scene) {
//         this.group = scene.physics.add.group();
//     }
// }

export default class SnakeGame extends Scene {
    cursor: Types.Input.Keyboard.CursorKeys;
    snake: Snake;
    food: Food;
    gameOverText: Phaser.GameObjects.Text;

    constructor() {
        super('SnakeGame');
    }

    preload() {
        this.load.image('food', 'assets/snake/food.png');
        this.load.image('body', 'assets/snake/body.png');
        // TODO: add bombs
        this.load.image('bomb', 'assets/bomb.png');
    }

    create() {
        this.cursor = this.input.keyboard.createCursorKeys();

        this.snake = new Snake(this, 8, 8);
        this.food = new Food(this, 3, 4);

        this.gameOverText = this.add.text(24, 24, '', {
            fontSize: '48px',
            color: '#ff0000',
        });
    }

    update(time) {
        const { snake, food, cursor } = this;

        if (!snake.alive) {
            this.gameOverText.setText(`Game Over! Score: ${food.total}`);
            this.physics.pause();
            return;
        }

        if (cursor.left.isDown) {
            snake.faceLeft();
        } else if (cursor.right.isDown) {
            snake.faceRight();
        } else if (cursor.up.isDown) {
            snake.faceUp();
        } else if (cursor.down.isDown) {
            snake.faceDown();
        }

        if (snake.update(time)) {
            if (snake.collideWithFood(food)) {
                repositionFood(snake, food);
            }
        }
    }
}
