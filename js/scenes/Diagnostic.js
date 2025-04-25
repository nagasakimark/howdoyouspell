class Diagnostic extends Phaser.Scene {
    constructor() {
        super({ key: 'Diagnostic' });
    }

    preload() {
        // Load a simple shape if images fail
        this.load.image('test-rect', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAEUlEQVRoge3BAQ0AAADCoPdPbQ8HFAAA8BLDOaEAAAAASUVORK5CYII=');
    }

    create() {
        // Add a plain colored rectangle as background
        this.add.rectangle(0, 0, 2000, 2000, 0x6666ff).setOrigin(0);
        
        // Add text to show we're in the diagnostic scene
        this.add.text(10, 10, 'DIAGNOSTIC MODE', {
            font: '24px Arial',
            color: '#ffffff'
        });
        
        // Log some diagnostic info
        console.log('Diagnostic scene running');
        console.log('Canvas dimensions:', this.sys.game.canvas.width, 'x', this.sys.game.canvas.height);
        console.log('Scale mode:', this.sys.game.scale.scaleMode);
        console.log('Available textures:', Object.keys(this.textures.list));
        
        // Add keyboard handler to try different things
        this.input.keyboard.on('keydown-ONE', () => {
            // Try loading chalkboard image directly
            this.load.image('direct-chalkboard', 'assets/images/chalkboard.png');
            this.load.once('complete', () => {
                this.add.image(100, 100, 'direct-chalkboard').setOrigin(0).setDisplaySize(200, 200);
                console.log('Loaded chalkboard directly');
            });
            this.load.start();
        });
        
        this.input.keyboard.on('keydown-TWO', () => {
            // Try with simple test rectangle
            this.add.image(300, 100, 'test-rect').setOrigin(0).setDisplaySize(200, 200);
            console.log('Added test rectangle');
        });
        
        this.input.keyboard.on('keydown-THREE', () => {
            // Try to load a scene
            console.log('Attempting to load MainMenu scene');
            this.scene.start('MainMenu');
        });
        
        // Add instructions
        const instructions = [
            '1: Try loading chalkboard image',
            '2: Show test rectangle',
            '3: Try MainMenu scene',
            'Press numpad * to view debug logs'
        ];
        
        let y = 50;
        instructions.forEach(text => {
            this.add.text(10, y, text, {
                font: '18px Arial',
                color: '#ffffff'
            });
            y += 30;
        });
    }
}

// Add to window
window.Diagnostic = Diagnostic; 