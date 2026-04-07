import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import StoreScene from './scenes/StoreScene.js';
import BarnScene from './scenes/BarnScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 400,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    backgroundColor: '#87CEEB', // Sky blue
    scene: [BootScene, MenuScene, GameScene, StoreScene, BarnScene]
};

const game = new Phaser.Game(config);

// Global state context for easy sharing
window.gameState = {
    currentUser: null
};
