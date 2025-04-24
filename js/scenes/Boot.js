class Boot extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
        
        // Track initialization state
        this.initialized = false;
    }

    preload() {
        try {
            // Create a simple loading text
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            console.log('Boot scene preload starting. Canvas size:', width, 'x', height);
            
            this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
                font: '24px Arial',
                fill: '#ffffff'
            });
            this.loadingText.setOrigin(0.5);
            
            // No assets need to be preloaded in Boot scene
            // Main assets will be loaded in the Preload scene
            
            // Handle successful load
            this.load.on('complete', () => {
                console.log('Boot assets loaded successfully');
                this.initialized = true;
            });
        } catch (error) {
            console.error('Error in Boot scene preload:', error);
            
            // Mark as initialized so we can continue
            this.initialized = true;
        }
    }

    create() {
        console.log('Boot scene complete, starting Preload scene');
        this.scene.start('Preload');
    }
}

// Explicitly add to window object
window.Boot = Boot; 