import Boot from './scenes/Boot.js';
import Preload from './scenes/Preload.js';
import MainMenu from './scenes/MainMenu.js';
import Game from './scenes/Game.js';
import Settings from './scenes/Settings.js';
import Help from './scenes/Help.js';

// Fixed resolution for the entire game - standard 1080p
const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;

// Create a custom canvas with proper pixel ratio handling
function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    return canvas;
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    canvas: createCanvas(),
    scale: {
        mode: Phaser.Scale.EXACT_FIT,  // Always stretch to fit the window exactly
        parent: 'game',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true
    },
    scene: [Boot, Preload, MainMenu, Game, Settings, Help]
};

// Export the configuration
export default config; 