class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
        this.fontLoaded = false;
        this.highScore = 0;
    }

    preload() {
        // Load high score before creating UI
        this.loadHighScore();
    }

    create() {
        // Set background
        this.add.image(0, 0, 'chalkboard').setOrigin(0).setDisplaySize(window.innerWidth, window.innerHeight);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Use the ChalkFont directly
        const fontFamily = 'ChalkFont, Arial';
        
        // Check if font is loaded or wait for it
        this.checkFontAndCreateUI(width, height, fontFamily);
    }
    
    loadHighScore() {
        // Default high score if not found
        this.highScore = 0;
        
        // Try to get high score from IndexedDB
        try {
            const request = indexedDB.open('SpellingGameDB', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create an object store if it doesn't exist
                if (!db.objectStoreNames.contains('gameScores')) {
                    db.createObjectStore('gameScores', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                
                // If the database was just created, it won't have any scores yet
                if (!db.objectStoreNames.contains('gameScores')) {
                    return;
                }
                
                const transaction = db.transaction(['gameScores'], 'readonly');
                const store = transaction.objectStore('gameScores');
                const getRequest = store.get('highScore');
                
                getRequest.onsuccess = () => {
                    if (getRequest.result) {
                        this.highScore = getRequest.result.score;
                        
                        // Update high score display if it exists
                        if (this.highScoreText) {
                            this.highScoreText.setText(`High Score: ${this.highScore}`);
                        }
                    }
                };
            };
        } catch (error) {
            console.error('Error loading high score:', error);
        }
    }
    
    checkFontAndCreateUI(width, height, fontFamily) {
        // If the font is already loaded by our preloader
        if (window.chalkFontLoaded) {
            console.log('Font already loaded by preloader, creating UI...');
            this.createMenuElements(width, height, fontFamily);
            return;
        }
        
        // Try to check if font is loaded using document.fonts API
        if (document.fonts && document.fonts.check(`1em ${fontFamily}`)) {
            console.log('Font detected as loaded via document.fonts.check');
            window.chalkFontLoaded = true;
            this.createMenuElements(width, height, fontFamily);
            return;
        }
        
        // If font is not loaded yet, wait for it
        console.log('Font not yet loaded, waiting...');
        
        // Set up a maximum wait time of 2 seconds
        const maxWaitTime = 2000;
        let waitStart = Date.now();
        
        // Function to check font status
        const checkFontStatus = () => {
            // First check our global flag (in case Preloader set it)
            if (window.chalkFontLoaded) {
                console.log('Font loaded flag detected');
                this.createMenuElements(width, height, fontFamily);
                return;
            }
            
            // Then try document.fonts API
            if (document.fonts && document.fonts.check(`1em ${fontFamily}`)) {
                console.log('Font detected as loaded via check');
                window.chalkFontLoaded = true;
                this.createMenuElements(width, height, fontFamily);
                return;
            }
            
            // Check if we've waited too long
            if (Date.now() - waitStart > maxWaitTime) {
                console.warn('Font load wait timeout - proceeding anyway');
                this.createMenuElements(width, height, fontFamily);
                return;
            }
            
            // Continue waiting
            setTimeout(checkFontStatus, 100);
        };
        
        // Start checking for font
        checkFontStatus();
    }

    createMenuElements(width, height, fontFamily) {
        // Add a simple panel for the main menu with a chalk-like border
        const panelWidth = 400;
        const panelHeight = 500;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2;
        
        // Create a chalk panel border (no background, just a white border)
        const panelBorder = this.add.rectangle(
            width / 2,
            height / 2,
            panelWidth,
            panelHeight,
            0x000000,
            0
        );
        panelBorder.setOrigin(0.5);
        panelBorder.setStrokeStyle(4, 0xffffff, 0.8); // White chalk border
        
        // Add game title with a simple chalk look - moved to the top
        const title = this.add.text(width / 2, 50, 'How do you spell...', {
            font: `64px ${fontFamily}`,
            fill: '#ffffff',  // White chalk
            stroke: '#ffffff',  // White chalk outline
            strokeThickness: 1,
            shadow: { offsetX: 1, offsetY: 1, color: '#333333', blur: 1, fill: true }
        });
        title.setOrigin(0.5);
        
        // Add very subtle animation to title
        this.tweens.add({
            targets: title,
            y: title.y - 3,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add high score display with simple chalk style
        this.highScoreText = this.add.text(width / 2, panelY + 120, `High Score: ${this.highScore}`, {
            font: `32px ${fontFamily}`,
            fill: '#ffffff',  // White chalk
            stroke: '#ffffff',  // White chalk outline
            strokeThickness: 0.5
        });
        this.highScoreText.setOrigin(0.5);
        
        // Create Menu Buttons - simple chalk style
        const buttonStyle = {
            font: `36px ${fontFamily}`,
            fill: '#ffffff',  // White chalk
            stroke: '#ffffff',  // White chalk outline
            strokeThickness: 0.5
        };
        
        const buttonHoverStyle = {
            fill: '#ffffcc',  // Slightly yellow chalk when hovered
            stroke: '#ffffff',
            strokeThickness: 1
        };
        
        const buttonPositions = [
            { y: panelY + 200, text: 'PLAY', scene: 'Game' },
            { y: panelY + 280, text: 'SETTINGS', scene: 'Settings' },
            { y: panelY + 360, text: 'HELP', scene: 'Help' }
        ];
        
        buttonPositions.forEach(btn => {
            // Create button border (no background, just a white border)
            const buttonBorder = this.add.rectangle(width / 2, btn.y, 200, 60, 0x000000, 0);
            buttonBorder.setOrigin(0.5);
            buttonBorder.setStrokeStyle(2, 0xffffff, 0.7); // White chalk border
            buttonBorder.setInteractive({ useHandCursor: true });
            
            // Create button text
            const buttonText = this.add.text(width / 2, btn.y, btn.text, buttonStyle);
            buttonText.setOrigin(0.5);
            
            // Button hover and click effects
            buttonBorder.on('pointerover', () => {
                buttonText.setStyle(buttonHoverStyle);
                buttonBorder.setStrokeStyle(3, 0xffffff, 0.9); // Brighter chalk when hovered
                buttonText.setScale(1.05);
            });
            
            buttonBorder.on('pointerout', () => {
                buttonText.setStyle(buttonStyle);
                buttonBorder.setStrokeStyle(2, 0xffffff, 0.7);
                buttonText.setScale(1);
            });
            
            buttonBorder.on('pointerdown', () => {
                // Click animation
                this.tweens.add({
                    targets: [buttonText, buttonBorder],
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => this.scene.start(btn.scene)
                });
            });
        });
    }
}

// Explicitly add to window object
window.MainMenu = MainMenu; 