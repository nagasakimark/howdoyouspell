class Preload extends Phaser.Scene {
    constructor() {
        super({ key: 'Preload' });
        this.characterFiles = [
            'anpanman.png', 'conan.png', 'doraemon.png', 'goku.png', 
            'kirby.png', 'luffy.png', 'mario.png', 'naruto.png', 
            'pikachu.png', 'sonic.png', 'totoro.png'
        ];
    }

    preload() {
        // Create a loading screen
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Add a background
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
        
        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '32px Arial',
            fill: '#ffffff'
        });
        loadingText.setOrigin(0.5);
        
        // Progress bar background
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);
        
        // Progress bar
        const progressBar = this.add.graphics();
        
        // Create loading animation
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 10);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            
            // Generate the characters array from loaded files
            this.generateCharactersArray();
            
            this.checkFontAndProceed();
        });
        
        // Load the chalk font (will be handled in index.html)
        
        // Load all character images from characters directory
        console.log('Loading character images from characters directory...');
        this.characterFiles.forEach(filename => {
            // Extract the character name from filename (without extension)
            const characterName = filename.split('.')[0];
            // Load the image with the character name as the key
            this.load.image(characterName, `assets/images/characters/${filename}`);
            console.log(`Loading character: ${characterName} (${filename})`);
        });
        
        // Load the chalkboard background
        this.load.image('chalkboard', 'assets/images/chalkboard.png');
        
        // Load star effect for animations
        this.load.image('star', 'assets/images/star.png');
        
        // Load QR code image
        this.load.image('qrcode', 'assets/images/qrcode.png');
    }
    
    generateCharactersArray() {
        // Create a global characters array based on loaded images
        window.characters = this.characterFiles.map(filename => {
            const name = filename.split('.')[0].toUpperCase();
            return {
                name: name,
                image: filename,
                description: `Character ${name}`
            };
        });
        
        console.log('Generated characters array:', window.characters);
    }
    
    checkFontAndProceed() {
        // Check if the font has already been loaded by the main HTML
        if (window.chalkFontLoaded) {
            this.scene.start('MainMenu');
            return;
        }
        
        // Try to check if font is available using the document.fonts API
        if (document.fonts && document.fonts.check('1em ChalkFont')) {
            console.log('ChalkFont is available - Preload detected');
            window.chalkFontLoaded = true;
            this.scene.start('MainMenu');
            return;
        }
        
        // If the font isn't loaded yet, we need to try to wait for it
        console.log('ChalkFont not detected yet - waiting...');
        
        // Modern browsers: Try to use Font Loading API
        if (document.fonts) {
            this.waitForFontWithTimeout();
        } else {
            // Fallback for browsers without Font Loading API
            // Just wait a bit and assume it loads
            setTimeout(() => {
                console.log('Timeout waiting for font - proceeding anyway');
                this.scene.start('MainMenu');
            }, 1000);
        }
    }
    
    waitForFontWithTimeout() {
        // Set a timeout for the font to load
        const timeout = 3000; // 3 seconds
        const fontLoadingStart = Date.now();
        
        const checkFont = () => {
            // Check if we've timed out
            if (Date.now() - fontLoadingStart > timeout) {
                console.warn('Font loading timed out - proceeding anyway');
                this.scene.start('MainMenu');
                return;
            }
            
            // Check if the font is loaded
            if (document.fonts.check('1em ChalkFont')) {
                console.log('ChalkFont loaded successfully');
                window.chalkFontLoaded = true;
                this.scene.start('MainMenu');
                return;
            }
            
            // Try again in a moment
            setTimeout(checkFont, 100);
        };
        
        // Start the recursive check
        checkFont();
        
        // Also listen for the loadingdone event as a backup
        document.fonts.addEventListener('loadingdone', (event) => {
            if (document.fonts.check('1em ChalkFont')) {
                console.log('ChalkFont loaded via loadingdone event');
                window.chalkFontLoaded = true;
                this.scene.start('MainMenu');
            }
        });
    }
}

// Explicitly add to window object
window.Preload = Preload; 