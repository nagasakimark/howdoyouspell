let game;

// Game settings with default values
const gameSettings = {
    keyboardEnabled: false,
    uppercase: true,
    lowercase: false,
    volume: 0.5
};

// Characters array will be dynamically populated in Preload.js
// based on the images found in the characters directory

// Wait for document and Phaser to be ready before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded, preparing game initialization');
    
    // Check if Phaser is available
    if (typeof Phaser === 'undefined') {
        console.error('Phaser not loaded! Game cannot start.');
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) {
            errorDisplay.style.display = 'block';
            errorDisplay.innerHTML = `
                <h3>Error: Phaser not loaded</h3>
                <p>The Phaser library could not be loaded. Check your internet connection.</p>
                <button onclick="location.reload()">Reload Page</button>
            `;
        }
        return;
    }
    
    // Check if config is available
    if (typeof config === 'undefined') {
        console.error('Game config not loaded! Check config.js');
        return;
    }
    
    // Check if all required scene classes are defined
    const requiredScenes = ['Boot', 'Preload', 'MainMenu', 'Game', 'Settings', 'Help'];
    const missingScenes = requiredScenes.filter(scene => typeof window[scene] !== 'function');
    
    if (missingScenes.length > 0) {
        console.error('Missing scene classes:', missingScenes);
        return;
    }
    
    console.log('All prerequisites checked, initializing game');
    
    try {
        // Create the game with the config
        game = new Phaser.Game(config);
        
        // Handle window resize
        window.addEventListener('resize', function() {
            console.log('Window resized, adjusting game dimensions');
            if (game && game.scale) {
                game.scale.resize(window.innerWidth, window.innerHeight);
            }
        });
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) {
            errorDisplay.style.display = 'block';
            errorDisplay.innerHTML = `
                <h3>Failed to initialize game</h3>
                <p>${error.message || 'Unknown error'}</p>
                <button onclick="location.reload()">Reload Page</button>
            `;
        }
    }
}); 