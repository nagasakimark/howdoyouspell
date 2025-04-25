import config from './config.js';

let game;

// Game settings with default values
window.gameSettings = {
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
    
    console.log('All prerequisites checked, initializing game');
    
    try {
        // Create the game with the config
        game = new Phaser.Game(config);
        
        // Force an initial resize
        if (game && game.scale) {
            setTimeout(() => {
                game.scale.refresh();
            }, 100);
        }
        
        // Simple resize handler - just refresh the scale when size changes
        window.addEventListener('resize', function() {
            console.log('Window resized, refreshing game scale');
            if (game && game.scale) {
                game.scale.refresh();
            }
        });
        
        // Also handle fullscreen changes
        document.addEventListener('fullscreenchange', function() {
            console.log('Fullscreen changed, refreshing game scale');
            if (game && game.scale) {
                game.scale.refresh();
            }
        });
        
        // Detect maximize/restore events (works in most modern browsers)
        window.addEventListener('maximized', function() {
            console.log('Window maximized, refreshing game scale');
            handleWindowChange();
        });
        
        window.addEventListener('restored', function() {
            console.log('Window restored, refreshing game scale');
            handleWindowChange();
        });
        
        // Use a MutationObserver to detect window attribute changes (like maximize/restore)
        // This is a more reliable way to catch maximize/restore events in browsers
        const windowObserver = new MutationObserver(function(mutations) {
            handleWindowChange();
        });
        
        // Start observing window attribute changes (size, position, etc.)
        if (window.outerWidth && window.outerHeight) {
            let lastWidth = window.outerWidth;
            let lastHeight = window.outerHeight;
            
            // Check periodically for maximize/restore changes
            setInterval(function() {
                const currentWidth = window.outerWidth;
                const currentHeight = window.outerHeight;
                
                if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
                    console.log('Window size changed (maximize/restore detected)');
                    handleWindowChange();
                    lastWidth = currentWidth;
                    lastHeight = currentHeight;
                }
            }, 500);
        }
        
        // Function to handle window changes (resize, maximize, restore)
        function handleWindowChange() {
            if (game && game.scale) {
                // Double refresh with delay to ensure proper scaling
                game.scale.refresh();
                
                // Second refresh after a delay to catch any lingering issues
                setTimeout(function() {
                    game.scale.refresh();
                }, 100);
            }
        }
        
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