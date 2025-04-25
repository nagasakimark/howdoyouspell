class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {
        const width = this.scale.gameSize.width;
        const height = this.scale.gameSize.height;
        
        // Set background with proper positioning
        this.background = this.add.image(width / 2, height / 2, 'chalkboard')
            .setOrigin(0.5)
            .setDisplaySize(width, height);
            
        // Make background responsive to canvas size changes
        this.scale.on('resize', this.updateBackground, this);
        
        // Use the ChalkFont directly
        const fontFamily = window.chalkFontLoaded ? 'ChalkFont, Arial' : 'Arial';
        
        // Add game title with chalk text
        const title = this.add.text(width / 2, height / 4, 'How do you spell...', {
            font: `64px ${fontFamily}`,
            fill: '#ffffff',  // White chalk
            stroke: '#ffffff',  // White chalk outline
            strokeThickness: 1,
            shadow: { offsetX: 1, offsetY: 1, color: '#333333', blur: 1, fill: true },
            resolution: 2  // Add higher resolution for crisper text rendering
        });
        title.setOrigin(0.5);
        
        // Add subtle animation to title
        this.tweens.add({
            targets: title,
            y: title.y - 3,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Create menu buttons
        const menuItems = [
            { y: height / 2 - 50, text: 'PLAY', scene: 'Game' },
            { y: height / 2 + 50, text: 'SETTINGS', scene: 'Settings' },
            { y: height / 2 + 150, text: 'HELP', scene: 'Help' }
        ];
        
        // Create menu buttons with chalk style
        menuItems.forEach(item => {
            // Create button border (no background, just a white border)
            const buttonBorder = this.add.rectangle(width / 2, item.y, 300, 60, 0x000000, 0);
            buttonBorder.setOrigin(0.5);
            buttonBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
            buttonBorder.setInteractive({ useHandCursor: true });
            
            const buttonText = this.add.text(width / 2, item.y, item.text, {
                font: `36px ${fontFamily}`,
                fill: '#ffffff',  // White chalk
                stroke: '#ffffff',  // White chalk outline
                strokeThickness: 0.5,
                resolution: 2  // Add higher resolution for crisper text rendering
            });
            buttonText.setOrigin(0.5);
            
            // Button hover effects
            buttonBorder.on('pointerover', () => {
                buttonText.setStyle({ fill: '#ffffcc' });  // Slightly yellow chalk when hovered
                buttonText.setScale(1.05);
                buttonBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
            });
            
            buttonBorder.on('pointerout', () => {
                buttonText.setStyle({ fill: '#ffffff' });
                buttonText.setScale(1);
                buttonBorder.setStrokeStyle(2, 0xffffff, 0.7);
            });
            
            // Scene transition with click effect
            buttonBorder.on('pointerdown', () => {
                // Click animation
                this.tweens.add({
                    targets: buttonText,
                    scale: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => this.scene.start(item.scene)
                });
            });
        });
        
        // Add high score display
        this.getHighScore().then(highScore => {
            if (highScore > 0) {
                const highScoreText = this.add.text(width / 2, height - 50, `High Score: ${highScore}`, {
                    font: `28px ${fontFamily}`,
                    fill: '#ffffff',  // White chalk
                    stroke: '#ffffff',  // White chalk outline
                    strokeThickness: 0.5,
                    resolution: 2  // Add higher resolution for crisper text rendering
                });
                highScoreText.setOrigin(0.5);
            }
        });
    }
    
    // Simple function to ensure background covers the screen
    updateBackground(gameSize) {
        if (this.background) {
            this.background.setPosition(gameSize.width / 2, gameSize.height / 2)
                .setDisplaySize(gameSize.width, gameSize.height);
        }
    }
    
    shutdown() {
        // Clean up event listeners
        this.scale.off('resize', this.updateBackground, this);
    }
    
    getHighScore() {
        return new Promise((resolve) => {
            // Default high score if not found
            let highScore = 0;
            
            // Try to get high score from IndexedDB
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
                    resolve(highScore);
                    return;
                }
                
                const transaction = db.transaction(['gameScores'], 'readonly');
                const store = transaction.objectStore('gameScores');
                const getRequest = store.get('highScore');
                
                getRequest.onsuccess = () => {
                    if (getRequest.result) {
                        highScore = getRequest.result.score;
                    }
                    resolve(highScore);
                };
                
                getRequest.onerror = () => {
                    console.error('Error reading high score');
                    resolve(highScore);
                };
            };
            
            request.onerror = () => {
                console.error('Error opening database');
                resolve(highScore);
            };
        });
    }
}

export default MainMenu; 