// Create a custom canvas element with willReadFrequently attribute
const createCustomCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('willReadFrequently', 'true');
    document.body.appendChild(canvas);
    return canvas;
};

// Define the scenes array safely
const getScenes = () => {
    console.log('Checking scene availability');
    
    // List of required scene classes
    const sceneClasses = [
        { key: 'Boot', class: window.Boot },
        { key: 'Preload', class: window.Preload },
        { key: 'MainMenu', class: window.MainMenu },
        { key: 'Game', class: window.Game },
        { key: 'Settings', class: window.Settings },
        { key: 'Help', class: window.Help }
    ];
    
    // Filter out any undefined scene classes and log warnings
    const availableScenes = sceneClasses.filter(scene => {
        const available = typeof scene.class === 'function';
        if (!available) {
            console.warn(`Scene class ${scene.key} is not available`);
        } else {
            console.log(`Scene class ${scene.key} is available`);
        }
        return available;
    }).map(scene => scene.class);
    
    return availableScenes;
};

const config = {
    // Explicitly set renderer to CANVAS
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2c3e50', // Dark blue-ish color (chalkboard-like)
    scene: getScenes(),
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    // Canvas configuration
    canvas: document.getElementById('game-canvas') || createCustomCanvas(),
    canvasStyle: 'display: block; width: 100%; height: 100%;',
    // Disable pixel art mode to make text smoother
    pixelArt: false,
    antialias: true,
    // Improve text rendering
    render: {
        antialias: true,
        crisp: false,
        roundPixels: false
    },
    // Add callbacks
    callbacks: {
        preBoot: function (game) {
            console.log('Phaser preBoot callback');
            
            // Make sure custom fonts are loaded
            document.fonts.ready.then(() => {
                console.log('Fonts are loaded and ready');
                if (document.fonts.check('1em ChalkFont')) {
                    console.log('ChalkFont is available');
                } else {
                    console.warn('ChalkFont is not available, will use fallback');
                }
            });
        },
        postBoot: function (game) {
            console.log('Phaser postBoot callback - game is running');
        }
    },
    disableContextMenu: true
}; 