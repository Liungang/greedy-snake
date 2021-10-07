import { Game, AUTO } from 'phaser';
import SnakeGame from '../scenes/snake';

const scenes = [SnakeGame];

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 800,
    height: 640,
    parent: 'main',
    backgroundColor: '#bfcc00',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 200
            }
        }
    },
    scene: scenes
}
const game = new Game(config);
game.scene.start('SnakeGame');