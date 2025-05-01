class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
        this.uiElements = new Map();
        this.wrongLetters = []; // Track wrong letter buttons
    }

    init() {
        // Game state variables
        this.currentCharacter = null;
        this.currentWord = '';
        this.targetWord = '';
        this.letterButtons = [];
        this.mistakes = 0;
        this.currentScore = 0;
        this.characterScores = []; // Track scores for each character
        this.currentCharacterIndex = 0; // Track which character we're on
        this.totalCharacters = 5; // Total characters to play
        this.startTime = 0;
        this.hintLetters = [];
        this.letterColor = '#ffffff'; // Single white color for all letters
        this.completionElements = []; // Track completion elements for cleanup
        this.usedCharacters = []; // Track characters used
        
        // Track consecutive wrong attempts for current letter
        this.consecutiveWrongAttempts = 0;
        
        // Store original word display position
        this.wordDisplayOriginalX = 0;
        
        // Use the chalk font directly
        this.fontFamily = window.chalkFontLoaded ? 'ChalkFont, Arial' : 'Arial';
        console.log(`Game init using font: ${this.fontFamily}, chalkFontLoaded: ${window.chalkFontLoaded}`);
        
        // Initialize sound properties
        this.soundEnabled = true; // Add option to mute later if needed
    }

    preload() {
        // Load sound effects
        this.load.audio('correctSound', 'assets/sounds/yes.mp3');
        this.load.audio('incorrectSound', 'assets/sounds/no.mp3');
        this.load.audio('winSound', 'assets/sounds/win.mp3');
    }

    create() {
        try {
            // Clean up any existing elements that might be left over from a previous game
            this.cleanupGame();
            
            // Set background with proper positioning to fill entire screen
            const width = this.scale.gameSize.width;
            const height = this.scale.gameSize.height;
            
            this.background = this.add.image(width / 2, height / 2, 'chalkboard')
                .setOrigin(0.5)
                .setDisplaySize(width, height);
                
            // Make background responsive to canvas size changes
            this.scale.on('resize', this.updateBackground, this);
            
            // Create UI elements
            this.createUI(width, height);
            
            // Create sound objects
            this.sounds = {
                correct: this.sound.add('correctSound'),
                incorrect: this.sound.add('incorrectSound'),
                win: this.sound.add('winSound')
            };
            
            // Set win sound volume to half
            this.sounds.win.setVolume(0.3);
            
            // Start the first character
            this.startNewCharacter();
            
            // Setup keyboard input if enabled
            if (gameSettings.keyboardEnabled) {
                this.setupKeyboardInput();
            }
            
            // If the chalk font loads after scene creation, update the font
            if (!window.chalkFontLoaded && document.fonts) {
                document.fonts.addEventListener('loadingdone', (event) => {
                    if (document.fonts.check(`1em ChalkFont`)) {
                        console.log('ChalkFont loaded during game - updating text elements');
                        window.chalkFontLoaded = true;
                        this.fontFamily = 'ChalkFont, Arial';
                        this.updateTextElements();
                    }
                });
            }
            
            // Add update loop to force-redraw wrong letter borders
            this.events.on('update', this.updateWrongLetterBorders, this);
        } catch (error) {
            console.error('Error in Game scene create:', error);
            // Try to recover by going back to main menu
            this.scene.start('MainMenu');
        }
    }

    startNewCharacter() {
        try {
            // Clear wrong letters tracking when starting a new character
            this.wrongLetters = [];
            
            // Clean up any previous character elements
            if (this.characterEntranceAnimation) {
                this.characterEntranceAnimation.stop();
            }
            
            // Clean up old letter buttons and borders
            if (this.letterButtons) {
                this.letterButtons.forEach(button => {
                    if (button && button.destroy) button.destroy();
                });
                this.letterButtons = [];
            }
            
            if (this.permanentBorders) {
                this.permanentBorders.forEach(border => {
                    if (border && border.destroy) border.destroy();
                });
                this.permanentBorders = [];
            }
            
            // Select a random character
            this.selectRandomCharacter();
            
            if (!this.currentCharacter) {
                console.error('Failed to select a character');
                return;
            }
            
            // Display character image
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            let textureToUse = this.currentCharacter.name.toLowerCase();
            
            // Check if the texture exists
            if (!this.textures.exists(textureToUse)) {
                console.warn(`Character texture not found: ${textureToUse}`);
                // Try to find any available character texture as fallback
                const availableTextures = Object.keys(this.textures.list).filter(
                    key => key !== '__MISSING' && key !== 'star' && key !== 'chalkboard'
                );
                
                if (availableTextures.length > 0) {
                    console.log(`Using fallback texture: ${availableTextures[0]}`);
                    textureToUse = availableTextures[0];
                } else {
                    // No textures available, return to main menu
                    console.error('No character textures available');
                    this.returnToMainMenu();
                    return;
                }
            }
            
            // Create a dramatic entrance for the new character
            if (this.characterImage) {
                // If we already have a character image, make it exit first
                this.tweens.add({
                    targets: this.characterImage,
                    x: -200,
                    angle: -10,
                    alpha: 0,
                    scale: 0.5,
                    duration: 500,
                    ease: 'Back.In',
                    onComplete: () => {
                        // Update texture and reset position off-screen for entrance
                        this.characterImage.setTexture(textureToUse);
                        this.characterImage.setPosition(-200, height * 0.4);
                        this.characterImage.setAlpha(1);
                        this.characterImage.setAngle(0);
                        this.characterImage.visible = true;
                        
                        // Scale image to fit properly
                        this.scaleCharacterImage(textureToUse);
                        
                        // Animate character entrance from left side
                        this.characterEntranceAnimation = this.tweens.add({
                            targets: this.characterImage,
                            x: width / 2,
                            duration: 800,
                            ease: 'Back.Out',
                            onComplete: this.setupCharacterFloatingAnimation.bind(this)
                        });
                    }
                });
            } else {
                // First time - create the image off-screen for entrance
                this.characterImage = this.add.image(-200, height * 0.4, textureToUse);
                this.characterImage.setOrigin(0.5);
                
                // Scale image to fit properly
                this.scaleCharacterImage(textureToUse);
                
                // Animate character entrance from left side
                this.characterEntranceAnimation = this.tweens.add({
                    targets: this.characterImage,
                    x: width / 2,
                    duration: 800,
                    ease: 'Back.Out',
                    onComplete: this.setupCharacterFloatingAnimation.bind(this)
                });
            }
            
            // Make sure word display is visible and empty
            if (this.wordDisplay) {
                this.wordDisplay.setText('');
                this.wordDisplay.visible = true;
                
                // Animate the word display placeholder
                this.wordDisplay.alpha = 0;
                this.tweens.add({
                    targets: this.wordDisplay,
                    alpha: 1,
                    duration: 600,
                    delay: 1000
                });
            }
            
            // Reset the current word
            this.currentWord = '';
            
            // Reset mistakes for this character
            this.mistakes = 0;
            
            // Generate letter buttons with a staggered appearance
            this.generateLetterButtons();
            
            // Start timer for this character
            this.startTime = Date.now();
            
            // Update the progress display with animation
            this.updateProgressDisplay(true);
        } catch (error) {
            console.error('Error in startNewCharacter:', error);
            this.returnToMainMenu();
        }
    }

    setupCharacterFloatingAnimation() {
        // Clear any existing animation
        this.tweens.killTweensOf(this.characterImage);
        
        // Add a more dynamic floating animation to make the character look more alive
        this.tweens.add({
            targets: this.characterImage,
            y: this.characterImage.y - 15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add a subtle rotation oscillation
        this.tweens.add({
            targets: this.characterImage,
            angle: 3,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 500 // Offset from the y-movement for more natural feeling
        });
    }

    updateProgressDisplay(animate = false) {
        if (this.progressText) {
            this.progressText.setText(`Character ${this.currentCharacterIndex + 1}/${this.totalCharacters}`);
            
            if (animate) {
                // Add a subtle animation to the progress text
                this.progressText.setScale(0.8);
                this.tweens.add({
                    targets: this.progressText,
                    scale: 1,
                    duration: 300,
                    ease: 'Back.Out'
                });
            }
        }
    }

    scaleCharacterImage(textureKey) {
        if (!this.characterImage) return;
        
        // Increased max dimensions to make character images larger
        const maxWidth = this.cameras.main.width * 0.65;
        const maxHeight = this.cameras.main.height * 0.45;
        
        // Get the image texture dimensions
        const texture = this.textures.get(textureKey || this.characterImage.texture.key);
        if (!texture || !texture.source || !texture.source[0]) {
            console.warn('Could not get texture information for scaling:', textureKey);
            // Set a default scale as fallback
            this.characterImage.setScale(0.5);
            return;
        }
        
        const frame = texture.source[0];
        
        // Calculate scale to fit within max dimensions while maintaining aspect ratio
        let scale = 1;
        if (frame.width > maxWidth || frame.height > maxHeight) {
            const widthRatio = maxWidth / frame.width;
            const heightRatio = maxHeight / frame.height;
            scale = Math.min(widthRatio, heightRatio);
        }
        
        this.characterImage.setScale(scale);
        
        // Add a subtle floating animation to make the character look more alive
        this.tweens.add({
            targets: this.characterImage,
            y: this.characterImage.y - 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    updateTextElements() {
        // Update all text elements with the newly loaded font
        if (this.wordDisplay) {
            this.wordDisplay.setStyle({ 
                font: `64px ${this.fontFamily}`,
                stroke: '#000000',
                strokeThickness: 3,
                resolution: 2  // Add higher resolution for crisper text rendering
            });
            // Force a redraw by setting the text again
            this.wordDisplay.setText(this.wordDisplay.text);
        }
        
        if (this.progressText) {
            this.progressText.setStyle({ 
                font: `28px ${this.fontFamily}`,
                stroke: '#000000',
                strokeThickness: 2,
                resolution: 2  // Add higher resolution for crisper text rendering
            });
            // Force a redraw
            this.progressText.setText(this.progressText.text);
        }
        
        // Update letter buttons
        this.letterButtons.forEach(button => {
            if (button.type === 'Text') {
                const size = button.getData('normalFont') || '48px';
                button.setStyle({ 
                    font: `${size} ${this.fontFamily}`,
                    stroke: '#000000',
                    strokeThickness: 3,
                    resolution: 2  // Add higher resolution for crisper text rendering
                });
                // Force a redraw
                if (button.text) {
                    button.setText(button.text);
                }
            }
        });
    }

    createUI(width, height) {
        try {
            // Add game title with chalk text
            const gameTitle = this.add.text(width / 2, 50, 'How do you spell...', {
                font: `48px ${this.fontFamily}`,
                fill: '#ffffff',  // White chalk
                stroke: '#ffffff',  // White chalk outline
                strokeThickness: 1,
                shadow: { offsetX: 1, offsetY: 1, color: '#333333', blur: 1, fill: true },
                resolution: 2  // Add higher resolution for crisper text rendering
            });
            gameTitle.setOrigin(0.5);
            
            // Add subtle animation to title
            this.tweens.add({
                targets: gameTitle,
                y: gameTitle.y - 3,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Create a display for the current word with chalk style
            this.wordDisplay = this.add.text(width / 2, height * 0.65, '', {
                font: `64px ${this.fontFamily}`,
                fill: '#ffffff',  // White chalk
                stroke: '#ffffff',  // White chalk outline
                strokeThickness: 1,
                resolution: 2  // Add higher resolution for crisper text rendering
            });
            this.wordDisplay.setOrigin(0.5);
            
            // Store the original position
            this.wordDisplayOriginalX = this.wordDisplay.x;
            
            // Create progress display with chalk style
            const progressBorder = this.add.rectangle(width - 175, 60, 250, 50, 0x000000, 0);
            progressBorder.setOrigin(0.5);
            progressBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
            
            this.progressText = this.add.text(width - 175, 60, `Character ${this.currentCharacterIndex + 1}/${this.totalCharacters}`, {
                font: `28px ${this.fontFamily}`,
                fill: '#ffffff',  // White chalk
                stroke: '#ffffff',  // White chalk outline
                strokeThickness: 0.5,
                resolution: 2  // Add higher resolution for crisper text rendering
            });
            this.progressText.setOrigin(0.5);
            
            // Add a back button with chalk style
            const backBorder = this.add.rectangle(105, 60, 150, 50, 0x000000, 0);
            backBorder.setOrigin(0.5);
            backBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
            backBorder.setInteractive({ useHandCursor: true });
            
            const backButton = this.add.text(105, 60, 'BACK', {
                font: `28px ${this.fontFamily}`,
                fill: '#ffffff',  // White chalk
                stroke: '#ffffff',  // White chalk outline
                strokeThickness: 0.5,
                resolution: 2  // Add higher resolution for crisper text rendering
            });
            backButton.setOrigin(0.5);
            backButton.setInteractive({ useHandCursor: true });
            
            // Button hover effect
            const backHover = () => {
                backButton.setStyle({ 
                    fill: '#ffffcc',
                    resolution: 2
                });  // Slightly yellow chalk when hovered
                backButton.setScale(1.05);
                backBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
            };
            
            const backNormal = () => {
                backButton.setStyle({ 
                    fill: '#ffffff',
                    resolution: 2
                });
                backButton.setScale(1);
                backBorder.setStrokeStyle(2, 0xffffff, 0.7);
            };
            
            backButton.on('pointerover', backHover);
            backButton.on('pointerout', backNormal);
            backButton.on('pointerdown', () => this.returnToMainMenu());
            
            backBorder.on('pointerover', backHover);
            backBorder.on('pointerout', backNormal);
            backBorder.on('pointerdown', () => this.returnToMainMenu());
        } catch (error) {
            console.error('Error creating UI:', error);
        }
    }

    selectRandomCharacter() {
        // Track used characters in this round
        if (!this.usedCharacters) {
            this.usedCharacters = [];
        }
        
        // Make sure we have the characters array
        if (!window.characters || window.characters.length === 0) {
            console.error('No characters available! Check if characters were properly loaded.');
            return;
        }
        
        // Filter out Naruto from the characters list
        const filteredCharacters = window.characters.filter(char => 
            char.name.toLowerCase() !== 'naruto'
        );
        
        // Select a random character that hasn't been used yet in this round
        let availableCharacters = filteredCharacters.filter(char => 
            !this.usedCharacters.includes(char.name.toLowerCase())
        );
        
        // If all characters have been used, reset the pool
        if (availableCharacters.length === 0) {
            console.log('All characters used, resetting character pool');
            availableCharacters = filteredCharacters;
            this.usedCharacters = [];
        }
        
        // Select a random character from available ones
        this.currentCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        
        // Add to used characters
        this.usedCharacters.push(this.currentCharacter.name.toLowerCase());
        
        // Set the target word based on letter case settings
        if (gameSettings.uppercase) {
            this.targetWord = this.currentCharacter.name.toUpperCase();
        } else if (gameSettings.lowercase) {
            this.targetWord = this.currentCharacter.name.toLowerCase();
        } else {
            // Mixed case - first letter uppercase, rest lowercase
            const firstLetter = this.currentCharacter.name.charAt(0).toUpperCase();
            const restOfWord = this.currentCharacter.name.slice(1).toLowerCase();
            this.targetWord = firstLetter + restOfWord;
        }
        
        console.log(`Selected character: ${this.currentCharacter.name}, target word: ${this.targetWord}`);
    }

    generateLetterButtons() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Clear any existing buttons
        this.letterButtons.forEach(button => button.destroy());
        this.letterButtons = [];
        
        // Track permanent borders separately
        this.permanentBorders = [];
        
        // Get all unique letters from the target word
        const targetLetters = [...new Set(this.targetWord.split(''))];
        
        // Add some distraction letters (wrong options)
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const distractionLetters = [];
        
        // We want exactly 16 letters total (2 rows of 8)
        const totalLetters = 16;
        const neededDistractors = Math.max(0, totalLetters - targetLetters.length);
        
        while (distractionLetters.length < neededDistractors) {
            const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
            if (!targetLetters.includes(randomLetter) && !distractionLetters.includes(randomLetter)) {
                distractionLetters.push(randomLetter);
            }
        }
        
        // Combine letters and shuffle
        let allLetters = [...targetLetters, ...distractionLetters];
        allLetters = this.shuffleArray(allLetters);
        
        // Handle letter case based on settings
        if (gameSettings.lowercase) {
            allLetters = allLetters.map(letter => letter.toLowerCase());
        }
        
        // Fixed layout: 2 rows of 8 letters
        const rows = 2;
        const buttonsPerRow = 8;
        
        // Button size and spacing
        const buttonSize = 75;
        const buttonSpacing = 95;
        
        // Calculate grid dimensions
        const gridWidth = buttonSpacing * buttonsPerRow;
        const gridHeight = buttonSpacing * rows;
        
        // The grid should be centered horizontally and positioned higher on the screen
        // to be closer to the word display
        const gridX = width / 2 - gridWidth / 2 + buttonSpacing / 2;
        const gridY = height * 0.8; // Move grid higher
        
        // Container padding
        const containerPadding = 20;
        
        // We still need to track container dimensions for layout purposes
        // but we're not creating a visible container anymore
        this.letterContainer = {
            width: gridWidth + containerPadding * 2,
            height: gridHeight + containerPadding * 2,
            x: width / 2,
            y: gridY + gridHeight/2 - buttonSpacing/2,
            setSize: function(w, h) { this.width = w; this.height = h; },
            setPosition: function(x, y) { this.x = x; this.y = y; }
        };
        
        // Create chalk-style letter buttons with staggered appearance
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < buttonsPerRow; c++) {
                const index = r * buttonsPerRow + c;
                if (index >= allLetters.length) continue;
                
                const letter = allLetters[index];
                
                // Calculate position
                const x = gridX + c * buttonSpacing;
                const y = gridY + r * buttonSpacing;
                
                // 1. Create PERMANENT border that will never be animated or hidden
                const permanentBorder = this.add.circle(
                    x, y, buttonSize / 1.8, 0x000000, 0
                );
                permanentBorder.setStrokeStyle(2, 0xffffff, 0.7);
                permanentBorder.setDepth(1); // Set lower depth to be behind the animated border
                this.permanentBorders.push(permanentBorder);
                
                // 2. Create ANIMATED border for effects (invisible by default)
                const animatedBorder = this.add.circle(
                    x, y, buttonSize / 1.8, 0x000000, 0
                );
                animatedBorder.setStrokeStyle(2, 0xffffff, 0);  // Start with invisible stroke
                animatedBorder.setDepth(2); // Higher depth to be in front
                
                // Define font sizes
                const normalFontSize = Math.floor(buttonSize * 0.8);
                const hoverFontSize = Math.floor(buttonSize * 0.9);
                
                // Create chalk letter text
                const button = this.add.text(
                    x,
                    y,
                    letter,
                    {
                        font: `${normalFontSize}px ${this.fontFamily}`,
                        fill: '#ffffff',  // White chalk
                        stroke: '#ffffff',  // White chalk outline
                        strokeThickness: 0.5,
                        resolution: 2  // Add higher resolution for crisper text rendering
                    }
                );
                
                // Center the text properly
                button.setOrigin(0.5);
                button.setDepth(3); // Highest depth to be on top
                
                // Store style info for later updates
                button.setData('normalFont', `${normalFontSize}px`);
                button.setData('hoverFont', `${hoverFontSize}px`);
                button.setData('buttonBorder', animatedBorder); // Store reference to the animated border
                button.setData('permanentBorder', permanentBorder); // Store reference to the permanent border
                button.setData('isWrong', false); // Flag to track if button is in wrong state
                button.setData('position', {x, y}); // Store position for easier reference
                animatedBorder.setData('textButton', button); // Store reference to the text
                animatedBorder.setData('isWrong', false); // Flag to track if border is in wrong state
                permanentBorder.setData('textButton', button); // Link permanent border to text
                
                // Set initial state for animation
                button.alpha = 0;
                button.scale = 0.5;
                animatedBorder.alpha = 0;
                animatedBorder.scale = 0.5;
                
                // Keep permanent border fully visible always
                permanentBorder.alpha = 1;
                
                // Create staggered animation for buttons appearing
                const delay = 100 + (index * 50); // Staggered delay based on button index
                
                this.tweens.add({
                    targets: [button, animatedBorder],
                    alpha: 1,
                    scale: 1,
                    duration: 400,
                    delay: delay,
                    ease: 'Back.Out'
                });
                
                // Make all interactive after animation completes
                this.time.delayedCall(delay + 400, () => {
                    button.setInteractive({ useHandCursor: true });
                    animatedBorder.setInteractive({ useHandCursor: true });
                    permanentBorder.setInteractive({ useHandCursor: true });
                });
                
                // Button hover effects
                const hoverButton = () => {
                    // Don't apply hover effect if currently in wrong state
                    if (button.getData('isWrong') || animatedBorder.getData('isWrong')) {
                        return;
                    }
                    
                    button.setStyle({ 
                        font: `${button.getData('hoverFont')} ${this.fontFamily}`,
                        fill: '#ffffcc',  // Slightly yellow chalk when hovered
                        stroke: '#ffffff',
                        strokeThickness: 1,
                        resolution: 2  // Add higher resolution for crisper text rendering
                    });
                    
                    // Enhanced hover animation
                    this.tweens.add({
                        targets: [button, animatedBorder],
                        scale: 1.1,
                        duration: 150,
                        ease: 'Sine.Out'
                    });
                    
                    // Show animated border on hover WITHOUT affecting permanent border
                    animatedBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
                    animatedBorder.alpha = 1;
                    
                    // Always ensure permanent border stays visible
                    permanentBorder.alpha = 1;
                };
                
                const normalButton = () => {
                    // Don't reset if currently in wrong state
                    if (button.getData('isWrong') || animatedBorder.getData('isWrong')) {
                        return;
                    }
                    
                    button.setStyle({ 
                        font: `${button.getData('normalFont')} ${this.fontFamily}`,
                        fill: '#ffffff',  // White chalk
                        stroke: '#ffffff',
                        strokeThickness: 0.5,
                        resolution: 2  // Add higher resolution for crisper text rendering
                    });
                    
                    // Reset scale with animation
                    this.tweens.add({
                        targets: [button, animatedBorder],
                        scale: 1,
                        duration: 150,
                        ease: 'Sine.Out'
                    });
                    
                    // Hide animated border on hover out
                    animatedBorder.setStrokeStyle(2, 0xffffff, 0);
                    animatedBorder.alpha = 0;
                    
                    // Always ensure permanent border stays visible
                    permanentBorder.alpha = 1;
                };
                
                // Make all elements respond to mouse over/out
                button.on('pointerover', hoverButton);
                button.on('pointerout', normalButton);
                animatedBorder.on('pointerover', hoverButton);
                animatedBorder.on('pointerout', normalButton);
                permanentBorder.on('pointerover', hoverButton);
                permanentBorder.on('pointerout', normalButton);
                
                // Click handler with enhanced animation
                const handleClick = () => {
                    // Store reference to clicked button for wrong letter effect
                    this.lastClickedButton = {
                        text: button,
                        border: animatedBorder,
                        permanentBorder: permanentBorder,
                        x: x,
                        y: y
                    };
                    
                    this.handleLetterSelection(letter);
                    
                    // Add a more dramatic click effect
                    this.tweens.add({
                        targets: [button, animatedBorder],
                        scale: 0.8,
                        duration: 100,
                        yoyo: true,
                        ease: 'Sine.Out',
                        onComplete: () => {
                            button.setScale(1);
                            animatedBorder.setScale(1);
                        }
                    });
                    
                    // Add a ripple effect on click
                    const ripple = this.add.circle(x, y, buttonSize / 2, 0xffffff, 0.4);
                    ripple.setOrigin(0.5);
                    
                    this.tweens.add({
                        targets: ripple,
                        scale: 2,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => ripple.destroy()
                    });
                };
                
                button.on('pointerdown', handleClick);
                animatedBorder.on('pointerdown', handleClick);
                permanentBorder.on('pointerdown', handleClick);
                
                this.letterButtons.push(button);
                this.letterButtons.push(animatedBorder);
            }
        }
    }

    handleLetterSelection(letter) {
        try {
            // Make sure letter is defined
            if (!letter) {
                console.warn('handleLetterSelection called with undefined letter');
                return;
            }
            
            // Get the next expected letter
            if (!this.targetWord || typeof this.targetWord !== 'string') {
                console.warn('targetWord is not properly defined:', this.targetWord);
                return;
            }
            
            const nextLetter = this.targetWord[this.currentWord.length];
            
            // Guard against undefined nextLetter (happens if we've reached the end of the word)
            if (nextLetter === undefined) {
                console.log('No more letters expected in current word');
                return;
            }
            
            // Store the clicked button for use in the wrong letter effect
            const clickedButton = this.lastClickedButton;
            
            if (letter.toUpperCase() === nextLetter.toUpperCase()) {
                // Play correct sound
                this.playSound('correct');
                
                // Correct letter
                this.currentWord += nextLetter; // Add the correct case version
                this.wordDisplay.setText(this.currentWord);
                
                // Reset wrong attempts counter when correct letter is selected
                this.consecutiveWrongAttempts = 0;
                
                // Remove this button from wrong letters tracking if it was there
                this.wrongLetters = this.wrongLetters.filter(obj => 
                    obj.text !== clickedButton.text
                );
                
                // Stop any ongoing animations for all buttons
                this.letterButtons.forEach(button => {
                    // Kill any ongoing tweens
                    this.tweens.killTweensOf(button);
                    
                    // Reset animation state
                    button.setScale(1);
                    
                    // Reset wrong state flags
                    if (button.getData) {
                        button.setData('isWrong', false);
                    }
                    
                    // Ensure buttons have proper styling
                    if (button.type === 'Text') {
                        button.setStyle({ 
                            font: `${button.getData('normalFont')} ${this.fontFamily}`,
                            fill: '#ffffff',
                            stroke: '#ffffff',
                            strokeThickness: 0.5,
                            resolution: 2
                        });
                    } else if (button.setStrokeStyle) {
                        button.setStrokeStyle(2, 0xffffff, 0.7);
                        button.alpha = 1;
                    }
                });
                
                // Add a more satisfying visual feedback for correct selection
                this.playCorrectLetterEffect();
                
                // Check if word is complete
                if (this.currentWord.length === this.targetWord.length) {
                    // Show sparkle animation before proceeding to completion
                    this.showCorrectAnimation();
                }
            } else {
                // Play incorrect sound
                this.playSound('incorrect');
                
                // Wrong letter - shake the display
                // Ensure we are starting from the original position
                this.wordDisplay.x = this.wordDisplayOriginalX;
                
                // Shake the word display
                this.tweens.add({
                    targets: this.wordDisplay,
                    x: this.wordDisplayOriginalX + 10,
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        // Reset position when animation is done
                        this.wordDisplay.x = this.wordDisplayOriginalX;
                    }
                });
                
                // Add a more noticeable wrong letter effect
                this.playWrongLetterEffect(clickedButton);
                
                // Increment wrong attempts counter
                this.consecutiveWrongAttempts++;
                
                // Show hint after 3 wrong attempts
                if (this.consecutiveWrongAttempts >= 3) {
                    this.showHint();
                    // Reset counter after showing hint
                    this.consecutiveWrongAttempts = 0;
                }
            }
        } catch (error) {
            console.error('Error in handleLetterSelection:', error);
        }
    }

    playCorrectLetterEffect() {
        // Play a satisfying popping effect for correct letter selections
        const letterPosition = this.currentWord.length - 1;
        const letterSpacing = 40; // Approximate spacing between letters
        const startX = this.wordDisplay.x - ((this.targetWord.length - 1) * letterSpacing / 2);
        const letterX = startX + (letterPosition * letterSpacing);
        const letterY = this.wordDisplay.y;
        
        // Create a small sparkle effect at the letter position
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 15;
            const x = letterX + Math.cos(angle) * radius;
            const y = letterY + Math.sin(angle) * radius;
            
            const sparkle = this.add.circle(x, y, 2 + Math.random() * 3, 0xffffcc, 0.9);
            
            this.tweens.add({
                targets: sparkle,
                alpha: 0,
                scale: 0,
                duration: 500 + Math.random() * 300,
                onComplete: () => sparkle.destroy()
            });
        }
        
        // Make the letter "pop" slightly
        this.tweens.add({
            targets: this.wordDisplay,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Back.Out'
        });
    }

    playWrongLetterEffect(clickedButton) {
        // Add a red visual effect directly on the clicked letter
        if (clickedButton && clickedButton.x && clickedButton.y) {
            // Create a red circle centered on the clicked letter
            const wrongCircle = this.add.circle(
                clickedButton.x,
                clickedButton.y,
                40,
                0xff0000,
                0.3
            );
            
            // Add a dramatic effect
            this.tweens.add({
                targets: wrongCircle,
                alpha: 0,
                scale: 1.5,
                duration: 400,
                onComplete: () => wrongCircle.destroy()
            });
            
            // Flash the button border red 
            if (clickedButton.text && clickedButton.permanentBorder) {
                // Create a tracking object for this wrong letter
                const wrongLetterObj = {
                    text: clickedButton.text,
                    permanentBorder: clickedButton.permanentBorder,
                    isAnimating: true,
                    x: clickedButton.x,
                    y: clickedButton.y
                };
                
                // Add to wrong letters array for constant monitoring
                this.wrongLetters.push(wrongLetterObj);
                
                // Kill any existing tweens on these objects
                this.tweens.killTweensOf(clickedButton.text);
                this.tweens.killTweensOf(clickedButton.border);
                this.tweens.killTweensOf(clickedButton.permanentBorder);
                
                // Set wrong state flags to prevent hover/out effects from interfering
                clickedButton.text.setData('isWrong', true);
                if (clickedButton.border) {
                    clickedButton.border.setData('isWrong', true);
                }
                
                // Make sure the text stays fully visible
                clickedButton.text.alpha = 1;
                
                // Store original permanent border color
                const permBorder = clickedButton.permanentBorder;
                const originalStroke = permBorder.strokeColor;
                const originalAlpha = permBorder.strokeAlpha;
                const originalWidth = permBorder.strokeWidth;
                
                // Make sure border is visible and prominent
                permBorder.visible = true;
                permBorder.alpha = 1;
                
                // Change permanent border to red stroke with increased visibility
                permBorder.setStrokeStyle(3, 0xff0000, 1);
                
                // Create a tween for the red color flashing
                this.tweens.add({
                    targets: permBorder,
                    strokeColor: originalStroke,
                    duration: 300,
                    delay: 200,
                    onComplete: () => {
                        // Keep the border visible but return to normal color
                        permBorder.setStrokeStyle(originalWidth, originalStroke, originalAlpha);
                        permBorder.alpha = 1; // Ensure it stays visible
                        permBorder.visible = true; // Extra safety to ensure visibility
                        
                        // Update animation state in tracking object
                        wrongLetterObj.isAnimating = false;
                        
                        // Reset wrong state flags after animation completes
                        this.time.delayedCall(50, () => {
                            clickedButton.text.setData('isWrong', false);
                            if (clickedButton.border) {
                                clickedButton.border.setData('isWrong', false);
                            }
                        });
                    }
                });
                
                // Make sure animated border is hidden since we're using the permanent border for feedback
                if (clickedButton.border) {
                    clickedButton.border.alpha = 0;
                }
            }
        } else {
            // Fallback if clicked button not available - show at word display
            const wrongCircle = this.add.circle(
                this.wordDisplay.x,
                this.wordDisplay.y + 40,
                40,
                0xff0000,
                0.3
            );
            
            this.tweens.add({
                targets: wrongCircle,
                alpha: 0,
                scale: 1.5,
                duration: 400,
                onComplete: () => wrongCircle.destroy()
            });
        }
    }

    showCorrectAnimation() {
        try {
            // Safety checks to ensure required objects exist
            if (!this.characterImage || !this.wordDisplay) {
                console.error('Required game objects missing in showCorrectAnimation');
                this.processWordComplete();
                return;
            }
            
            // Play win sound when a character name is completed
            this.playSound('win');
            
            // Clear all wrong letters tracking when word is complete
            this.wrongLetters = [];
            
            // Disable letter buttons while animation plays
            this.letterButtons.forEach(button => {
                if (button && button.input) button.input.enabled = false;
            });
            
            // Create chalkboard-themed animations that don't require loading assets
            this.createChalkboardCelebration();
            
            // Create floating text animation that says "Great job!" or similar phrases
            const encouragements = ['Good job!', 'Great!', 'Wonderful!', 'Good!', 'Wow!', 'Yes!'];
            const phrase = encouragements[Math.floor(Math.random() * encouragements.length)];
            
            const floatingText = this.add.text(
                this.characterImage.x,
                this.characterImage.y - 180, // Position higher to avoid overlap
                phrase,
                {
                    font: `48px ${this.fontFamily}`, // Bigger text
                    fill: '#ffffff',
                    stroke: '#000000', // Black outline instead of white
                    strokeThickness: 4, // Thicker outline
                    shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true } // Add shadow for better visibility
                }
            );
            floatingText.setOrigin(0.5);
            floatingText.alpha = 0;
            
            // Animate the floating text
            this.tweens.add({
                targets: floatingText,
                y: floatingText.y - 50,
                alpha: 1,
                scale: 1.2,
                duration: 600,
                ease: 'Back.Out',
                onComplete: () => {
                    this.tweens.add({
                        targets: floatingText,
                        y: floatingText.y - 30,
                        alpha: 0,
                        scale: 1.5,
                        duration: 800,
                        delay: 800,
                        ease: 'Back.In',
                        onComplete: () => floatingText.destroy()
                    });
                }
            });
            
            // More dramatic word display animation
            this.tweens.add({
                targets: this.wordDisplay,
                scale: 1.5,
                duration: 500,
                yoyo: true,
                ease: 'Bounce.Out'
            });
            
            // Make the character dance (wiggle side to side)
            this.tweens.add({
                targets: this.characterImage,
                x: this.characterImage.x + 20,
                angle: 5,
                duration: 100,
                yoyo: true,
                repeat: 5,
                ease: 'Sine.InOut'
            });
            
            // Process word completion after animation is done
            this.time.delayedCall(3000, () => {
                // Process word completion
                this.processWordComplete();
            });
            
        } catch (error) {
            console.error('Error in showCorrectAnimation:', error);
            // Ensure we still move forward even if animation fails
            this.processWordComplete();
        }
    }
    
    createChalkboardCelebration() {
        try {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            if (!this.wordDisplay || !this.characterImage) {
                console.warn('Required game objects missing in createChalkboardCelebration');
                return;
            }
            
            // Enhanced color palette for more vibrant chalk effects
            const chalkColors = [
                '#ffffff', // White
                '#ffffcc', // Light yellow
                '#ffccff', // Light pink
                '#ccffff', // Light blue
                '#ffffaa', // Creamy yellow
                '#ffaacc', // Pink
                '#aaccff', // Light blue
                '#ffcc88', // Light orange
                '#ccff88', // Light green
                '#ff88ff'  // Bright pink
            ];
            
            // Function to get a random chalk color
            const getRandomChalkColor = () => chalkColors[Math.floor(Math.random() * chalkColors.length)];
            
            // Create chalk-like particles using circles instead of star sprites
            const createChalkParticles = (x, y, count, color = '#ffffff', scale = 1) => {
                try {
                    for (let i = 0; i < count; i++) {
                        // Random position around the center point
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * 100 * scale;
                        const particleX = x + Math.cos(angle) * distance;
                        const particleY = y + Math.sin(angle) * distance;
                        
                        // Create a small chalk dot
                        const particle = this.add.circle(
                            particleX,
                            particleY,
                            1 + Math.random() * 2 * scale,
                            Phaser.Display.Color.HexStringToColor(color).color,
                            0.8
                        );
                        
                        // Add movement and fade animation
                        this.tweens.add({
                            targets: particle,
                            x: particleX + (Math.random() * 60 - 30) * scale,
                            y: particleY + (Math.random() * 60 - 30) * scale,
                            alpha: 0,
                            scale: { from: 1, to: 0.2 },
                            duration: 1000 + Math.random() * 1000,
                            onComplete: () => particle.destroy()
                        });
                    }
                } catch (err) {
                    console.error('Error creating chalk particles:', err);
                }
            };
            
            // Create chalk dust around the word
            createChalkParticles(this.wordDisplay.x, this.wordDisplay.y, 30, getRandomChalkColor());
            
            // Create chalk dust around the character
            createChalkParticles(this.characterImage.x, this.characterImage.y, 40, getRandomChalkColor());
            
            // Create a chalk dust burst animation (firework effect)
            const createChalkBurst = (x, y, color = '#ffffff', scale = 1) => {
                try {
                    const burstLines = [];
                    const lineCount = 10 + Math.floor(Math.random() * 8); // Increased line count
                    
                    // Create burst lines radiating from center
                    for (let i = 0; i < lineCount; i++) {
                        const angle = (i / lineCount) * Math.PI * 2;
                        const lineLength = (30 + Math.random() * 40) * scale; // Increased length variation
                        
                        // Create line starting points
                        const startX = x + Math.cos(angle) * 5;
                        const startY = y + Math.sin(angle) * 5;
                        
                        // Create end points
                        const endX = x + Math.cos(angle) * lineLength;
                        const endY = y + Math.sin(angle) * lineLength;
                        
                        // Draw the line
                        const line = this.add.line(
                            0, 0,
                            startX, startY,
                            endX, endY,
                            Phaser.Display.Color.HexStringToColor(color).color,
                            0.8 // Increased opacity
                        );
                        line.setLineWidth(1 + Math.random() * 2 * scale);
                        
                        burstLines.push(line);
                        
                        // Animate the line growing from center
                        this.tweens.add({
                            targets: line,
                            alpha: { from: 0.8, to: 0 },
                            duration: 700 + Math.random() * 500, // Longer duration for better visibility
                            onComplete: () => line.destroy()
                        });
                        
                        // Add particles along the lines for extra effect
                        if (Math.random() > 0.5) {
                            const particleX = x + Math.cos(angle) * lineLength * 0.7;
                            const particleY = y + Math.sin(angle) * lineLength * 0.7;
                            
                            const sparkle = this.add.circle(
                                particleX, particleY,
                                2 + Math.random() * 2,
                                Phaser.Display.Color.HexStringToColor(getRandomChalkColor()).color,
                                0.9
                            );
                            
                            this.tweens.add({
                                targets: sparkle,
                                alpha: 0,
                                scale: { from: 1.5, to: 0.2 },
                                duration: 600 + Math.random() * 400,
                                onComplete: () => sparkle.destroy()
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error creating chalk burst:', err);
                }
            };
            
            // Create multiple chalk bursts with slight delays
            // Increased the number of bursts and added variation in placement
            for (let i = 0; i < 8; i++) { // Increased from 5 to 8 bursts
                this.time.delayedCall(i * 250, () => {
                    try {
                        // More varied positions
                        const x = width * 0.3 + Math.random() * width * 0.4;
                        const y = height * 0.2 + Math.random() * height * 0.4;
                        
                        // Random color from enhanced chalk palette
                        const color = getRandomChalkColor();
                        const scale = 0.8 + Math.random() * 0.8; // Varied sizes
                        
                        createChalkBurst(x, y, color, scale);
                        createChalkParticles(x, y, 15 + Math.floor(Math.random() * 10), color);
                    } catch (err) {
                        console.error('Error in chalk burst delayed call:', err);
                    }
                });
            }
            
            // Add more firework effects specifically around the character
            for (let i = 0; i < 3; i++) {
                this.time.delayedCall(i * 400 + 200, () => {
                    try {
                        const x = this.characterImage.x + (Math.random() * 200 - 100);
                        const y = this.characterImage.y + (Math.random() * 200 - 100);
                        const color = getRandomChalkColor();
                        
                        createChalkBurst(x, y, color, 1.2);
                        
                        // Add extra particles for more visual impact
                        createChalkParticles(x, y, 25, color, 1.3);
                    } catch (err) {
                        console.error('Error in character burst effect:', err);
                    }
                });
            }
            
            // Create chalk circles that expand outward
            for (let i = 0; i < 4; i++) { // Increased from 3 to 4
                this.time.delayedCall(i * 250, () => {
                    try {
                        // Add circles at both word and character positions
                        const positions = [
                            { x: this.wordDisplay.x, y: this.wordDisplay.y },
                            { x: this.characterImage.x, y: this.characterImage.y },
                            { x: width/2, y: height/2 }
                        ];
                        
                        const pos = positions[i % positions.length];
                        const color = Phaser.Display.Color.HexStringToColor(getRandomChalkColor()).color;
                        
                        const circle = this.add.circle(
                            pos.x,
                            pos.y,
                            5,
                            color,
                            0.5
                        );
                        circle.setStrokeStyle(2, color, 0.7);
                        
                        this.tweens.add({
                            targets: circle,
                            radius: 100 + Math.random() * 50,
                            alpha: 0,
                            duration: 1000 + Math.random() * 500,
                            ease: 'Cubic.Out',
                            onComplete: () => circle.destroy()
                        });
                    } catch (err) {
                        console.error('Error creating expanding circle:', err);
                    }
                });
            }
            
            // Add floating "sparks" for extra flair
            for (let i = 0; i < 20; i++) {
                this.time.delayedCall(Math.random() * 1500, () => {
                    try {
                        const x = width * 0.2 + Math.random() * width * 0.6;
                        const y = height * 0.2 + Math.random() * height * 0.6;
                        
                        const spark = this.add.circle(
                            x, y,
                            1 + Math.random() * 2,
                            Phaser.Display.Color.HexStringToColor(getRandomChalkColor()).color,
                            0.9
                        );
                        
                        this.tweens.add({
                            targets: spark,
                            x: x + (Math.random() * 80 - 40),
                            y: y - 40 - Math.random() * 40, // Float upward
                            alpha: 0,
                            scale: { from: 1, to: 0 },
                            duration: 1200 + Math.random() * 800,
                            ease: 'Sine.Out',
                            onComplete: () => spark.destroy()
                        });
                    } catch (err) {
                        console.error('Error creating floating spark:', err);
                    }
                });
            }
        } catch (error) {
            console.error('Error in createChalkboardCelebration:', error);
        }
    }
    
    processWordComplete() {
        // Clear wrong letters tracking when word is complete
        this.wrongLetters = [];
        
        // Calculate score based on time and mistakes
        const timeElapsed = (Date.now() - this.startTime) / 1000; // in seconds
        const baseScore = 10000;
        const timeDeduction = Math.min(5000, timeElapsed * 100); // Deduct up to 5000 points for time
        const mistakeDeduction = this.mistakes * 500; // Deduct 500 points per mistake
        
        const characterScore = Math.max(0, Math.floor(baseScore - timeDeduction - mistakeDeduction));
        this.characterScores.push(characterScore);
        
        // Increment character count
        this.currentCharacterIndex++;
        
        // First destroy any previous completion elements
        this.cleanupCompletionElements();
        
        // Hide letter buttons container
        if (this.letterContainer) {
            this.letterContainer.visible = false;
        }
        
        // Hide all letter buttons
        this.letterButtons.forEach(button => {
            button.visible = false;
        });
        
        // Hide all permanent borders
        if (this.permanentBorders) {
            this.permanentBorders.forEach(border => {
                if (border) border.visible = false;
            });
        }
        
        // Hide character and word display
        this.characterImage.visible = false;
        this.wordDisplay.visible = false;
        
        // Check if all characters are complete
        if (this.currentCharacterIndex >= this.totalCharacters) {
            this.showGameResults();
        } else {
            this.showCharacterComplete();
        }
    }

    showHint() {
        // Safely get the next letter
        if (this.currentWord.length >= this.targetWord.length) {
            console.log('No hint needed - word is complete');
            return;
        }
        
        // Highlight the next correct letter in the buttons
        const nextLetter = this.targetWord[this.currentWord.length];
        
        if (!nextLetter) {
            console.warn('Cannot show hint - nextLetter is undefined');
            return;
        }
        
        // Find buttons that match this letter
        let foundHintButton = false;
        
        for (const button of this.letterButtons) {
            // Only process Text objects, not backgrounds or containers
            if (button.type !== 'Text' || !button.text) continue;
            
            try {
                if (button.text.toUpperCase() === nextLetter.toUpperCase()) {
                    // Add pulsing animation to hint at the correct letter
                    if (!this.hintLetters.includes(button)) {
                        foundHintButton = true;
                        this.hintLetters.push(button);
                        
                        // Make the hint very obvious
                        button.setStyle({
                            font: `${button.getData('hoverFont')} ${this.fontFamily}`,
                            fill: '#ffff00',
                            stroke: '#ff0000',
                            strokeThickness: 5
                        });
                        
                        // Get the container reference for animation
                        const containerRef = button.getData('containerRef');
                        if (containerRef) {
                            this.tweens.add({
                                targets: containerRef,
                                scale: 1.4,
                                duration: 500,
                                yoyo: true,
                                repeat: -1,
                                ease: 'Sine.easeInOut'
                            });
                        } else {
                            // Fallback to animating just the button if container not found
                            this.tweens.add({
                                targets: button,
                                scale: 1.4,
                                duration: 500,
                                yoyo: true,
                                repeat: -1,
                                ease: 'Sine.easeInOut'
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('Error processing button for hint:', e, button);
            }
        }
        
        if (!foundHintButton) {
            console.warn('Could not find button for hint letter:', nextLetter);
        }
    }

    showCharacterComplete() {
        try {
            // Clear wrong letters tracking
            this.wrongLetters = [];
            
            // Show simple completion message
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Create a completion panel
            const panelWidth = Math.min(400, width * 0.8);
            const panelHeight = 250;
            const panelX = width / 2 - panelWidth / 2;
            const panelY = height / 2 - panelHeight / 2;
            
            // Create a chalk border
            const completionBorder = this.add.rectangle(
                width / 2,
                height / 2,
                panelWidth,
                panelHeight,
                0x000000,
                0
            );
            completionBorder.setOrigin(0.5);
            completionBorder.setStrokeStyle(3, 0xffffff, 0.8);  // White chalk border
            this.completionElements.push(completionBorder);
            
            // Add completion text
            const completionText = this.add.text(
                width / 2, 
                panelY + 80, 
                'CORRECT!', {
                    font: `48px ${this.fontFamily}`,
                    fill: '#ffffff',  // White chalk
                    stroke: '#ffffff',  // White chalk outline
                    strokeThickness: 1
                }
            );
            completionText.setOrigin(0.5);
            this.completionElements.push(completionText);
            
            // Button for next character - made wider
            const nextBorder = this.add.rectangle(width / 2, panelY + 170, 300, 60, 0x000000, 0);
            nextBorder.setOrigin(0.5);
            nextBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
            nextBorder.setInteractive({ useHandCursor: true });
            this.completionElements.push(nextBorder);
            
            const nextButton = this.add.text(
                width / 2, 
                panelY + 170, 
                'NEXT CHARACTER', {
                    font: `28px ${this.fontFamily}`,
                    fill: '#ffffff',  // White chalk
                    stroke: '#ffffff',  // White chalk outline
                    strokeThickness: 0.5
                }
            );
            nextButton.setOrigin(0.5);
            this.completionElements.push(nextButton);
            
            // Button hover effects
            nextBorder.on('pointerover', () => {
                nextButton.setStyle({ fill: '#ffffcc' });  // Slightly yellow chalk when hovered
                nextButton.setScale(1.05);
                nextBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
            });
            
            nextBorder.on('pointerout', () => {
                nextButton.setStyle({ fill: '#ffffff' });
                nextButton.setScale(1);
                nextBorder.setStrokeStyle(2, 0xffffff, 0.7);
            });
            
            // Go to next character
            nextBorder.on('pointerdown', () => {
                try {
                    // Add a click effect
                    this.tweens.add({
                        targets: nextButton,
                        scale: 0.95,
                        duration: 100,
                        yoyo: true,
                        onComplete: () => {
                            // Clean up everything properly before starting new character
                            this.cleanupCompletionElements();
                            
                            // Add a slight delay before starting the new character
                            this.time.delayedCall(100, () => {
                                this.startNewCharacter();
                            });
                        }
                    });
                } catch (err) {
                    console.error('Error moving to next character:', err);
                    this.returnToMainMenu();
                }
            });
        } catch (error) {
            console.error('Error showing character complete:', error);
            this.returnToMainMenu();
        }
    }
    
    showGameResults() {
        try {
            // Calculate the final score
            const totalScore = this.characterScores.reduce((sum, score) => sum + score, 0);
            const finalScore = Math.floor(totalScore / this.characterScores.length);
            
            // Check if this is a high score
            this.getHighScore().then(highScore => {
                const isHighScore = finalScore > highScore;
                this.saveHighScore(finalScore);
                
                // Play win sound for game completion
                this.playSound('win');
                
                // Show game completion message
                const width = this.cameras.main.width;
                const height = this.cameras.main.height;
                
                // Create a results panel
                const panelWidth = Math.min(500, width * 0.8);
                const panelHeight = 350;
                const panelX = width / 2 - panelWidth / 2;
                const panelY = height / 2 - panelHeight / 2;
                
                // Create a grand finale effect
                this.createCelebrationEffect(isHighScore);
                
                // Create a more visually exciting panel with an animated entrance
                const completionBorder = this.add.rectangle(
                    width / 2,
                    height / 2 - 400, // Start off-screen
                    panelWidth,
                    panelHeight,
                    0x000000,
                    0
                );
                completionBorder.setOrigin(0.5);
                completionBorder.setStrokeStyle(4, 0xffffff, 0.8);  // White chalk border
                this.completionElements.push(completionBorder);
                
                // Animate the panel's entrance
                this.tweens.add({
                    targets: completionBorder,
                    y: height / 2,
                    duration: 800,
                    ease: 'Bounce.Out',
                    delay: 300
                });
                
                // Game complete title with dramatic entrance
                const titleText = this.add.text(
                    width / 2, 
                    panelY - 100, // Start off-screen
                    'GAME COMPLETE!', {
                        font: `46px ${this.fontFamily}`,
                        fill: '#ffffff',  // White chalk
                        stroke: '#000000',  // Black outline instead of white
                        strokeThickness: 4, // Thicker stroke
                        shadow: { offsetX: 1, offsetY: 1, color: '#333333', blur: 1, fill: true }
                    }
                );
                titleText.setOrigin(0.5);
                titleText.alpha = 0; // Start invisible for fade-in
                this.completionElements.push(titleText);
                
                // Animate the title's entrance with fade in
                this.tweens.add({
                    targets: titleText,
                    y: panelY + 70,
                    alpha: 1, // Fade in
                    duration: 800,
                    ease: 'Bounce.Out',
                    delay: 600,
                    onComplete: () => {
                        // Add subtle animation to title
                        this.tweens.add({
                            targets: titleText,
                            y: titleText.y - 3,
                            duration: 2000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                });
                
                // Show final score with counting animation
                const scoreText = this.add.text(
                    width / 2, 
                    panelY + 150, 
                    `Final Score: 0`, {
                        font: `42px ${this.fontFamily}`,
                        fill: '#ffffff',  // White chalk
                        stroke: '#000000',  // Black outline instead of white
                        strokeThickness: 3, // Thicker stroke
                    }
                );
                scoreText.setOrigin(0.5);
                scoreText.alpha = 0;
                this.completionElements.push(scoreText);
                
                // Animate the score appearance
                this.tweens.add({
                    targets: scoreText,
                    alpha: 1,
                    scale: 1.2,
                    duration: 500,
                    delay: 1200,
                    onComplete: () => {
                        // Count up the score for a more satisfying effect
                        let displayScore = 0;
                        const countStep = Math.max(1, Math.floor(finalScore / 50)); // Adjust speed based on final score
                        
                        const scoreCounter = this.time.addEvent({
                            delay: 30,
                            callback: () => {
                                displayScore = Math.min(displayScore + countStep, finalScore);
                                scoreText.setText(`Final Score: ${displayScore}`);
                                
                                // Add small particles when counting
                                if (displayScore < finalScore) {
                                    // Create small particles at the score text
                                    const particle = this.add.circle(
                                        scoreText.x + (Math.random() * scoreText.width - scoreText.width/2), 
                                        scoreText.y, 
                                        2, 
                                        0xffffcc, 
                                        0.8
                                    );
                                    
                                    this.tweens.add({
                                        targets: particle,
                                        y: particle.y - 20 - Math.random() * 20,
                                        alpha: 0,
                                        duration: 600,
                                        onComplete: () => particle.destroy()
                                    });
                                }
                                
                                // If we've reached the final score, do a little celebration
                                if (displayScore >= finalScore) {
                                    scoreCounter.remove();
                                    
                                    // Make the score pulse
                                    this.tweens.add({
                                        targets: scoreText,
                                        scale: 1.5,
                                        duration: 200,
                                        yoyo: true,
                                        repeat: 1,
                                        ease: 'Sine.easeInOut',
                                        onComplete: () => {
                                            // Keep a subtle breathing animation
                                            this.tweens.add({
                                                targets: scoreText,
                                                scale: 1.1,
                                                duration: 1500,
                                                yoyo: true,
                                                repeat: -1,
                                                ease: 'Sine.easeInOut'
                                            });
                                        }
                                    });
                                }
                            },
                            repeat: Math.ceil(finalScore / countStep)
                        });
                    }
                });
                
                // If it's a high score, show a special high score message
                if (isHighScore) {
                    const highScoreText = this.add.text(
                        width / 2,
                        panelY + 200,
                        'NEW HIGH SCORE!',
                        {
                            font: `30px ${this.fontFamily}`,
                            fill: '#ffff00',
                            stroke: '#000000', // Black outline
                            strokeThickness: 3 // Thicker stroke
                        }
                    );
                    highScoreText.setOrigin(0.5);
                    highScoreText.alpha = 0;
                    this.completionElements.push(highScoreText);
                    
                    // Animate the high score text with a special effect
                    this.tweens.add({
                        targets: highScoreText,
                        alpha: 1,
                        scale: { from: 0.5, to: 1.2 },
                        duration: 800,
                        delay: 2000,
                        ease: 'Back.Out',
                        onComplete: () => {
                            // Add a pulsing glow effect
                            this.tweens.add({
                                targets: highScoreText,
                                scale: 1,
                                duration: 600,
                                yoyo: true,
                                repeat: -1,
                                ease: 'Sine.InOut'
                            });
                        }
                    });
                }
                
                // Buttons with animated entrance
                const buttonY = panelY + 250;
                
                // New Game button - create off-screen and invisible
                const newGameBorder = this.add.rectangle(
                    width / 2 - 200, // Start off-screen
                    buttonY,
                    180,
                    60,
                    0x000000,
                    0
                );
                newGameBorder.setOrigin(0.5);
                newGameBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
                newGameBorder.alpha = 0; // Start invisible
                newGameBorder.setInteractive({ useHandCursor: true });
                this.completionElements.push(newGameBorder);
                
                // Main Menu button - create off-screen and invisible
                const exitBorder = this.add.rectangle(
                    width + 200, // Start off-screen
                    buttonY,
                    180,
                    60,
                    0x000000,
                    0
                );
                exitBorder.setOrigin(0.5);
                exitBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
                exitBorder.alpha = 0; // Start invisible
                exitBorder.setInteractive({ useHandCursor: true });
                this.completionElements.push(exitBorder);
                
                // New Game button text
                const newGameText = this.add.text(
                    width / 2 - 200, // Start off-screen
                    buttonY, 
                    'NEW GAME', {
                        font: `28px ${this.fontFamily}`,
                        fill: '#ffffff',  // White chalk
                        stroke: '#000000',  // Black outline
                        strokeThickness: 2
                    }
                );
                newGameText.setOrigin(0.5);
                newGameText.alpha = 0; // Start invisible
                this.completionElements.push(newGameText);
                
                // Main Menu button text
                const exitText = this.add.text(
                    width + 200, // Start off-screen
                    buttonY, 
                    'MAIN MENU', {
                        font: `28px ${this.fontFamily}`,
                        fill: '#ffffff',  // White chalk
                        stroke: '#000000',  // Black outline
                        strokeThickness: 2
                    }
                );
                exitText.setOrigin(0.5);
                exitText.alpha = 0; // Start invisible
                this.completionElements.push(exitText);
                
                // Animate buttons sliding in from sides and fading in
                this.tweens.add({
                    targets: [newGameBorder, newGameText],
                    x: width / 2 - 100,
                    alpha: 1, // Fade in
                    duration: 600,
                    ease: 'Back.Out',
                    delay: 1800
                });
                
                this.tweens.add({
                    targets: [exitBorder, exitText],
                    x: width / 2 + 100,
                    alpha: 1, // Fade in
                    duration: 600,
                    ease: 'Back.Out',
                    delay: 1900
                });
                
                // Hover effects for New Game button
                newGameBorder.on('pointerover', () => {
                    newGameText.setStyle({ fill: '#ffffcc' });  // Slightly yellow chalk when hovered
                    this.tweens.add({
                        targets: [newGameBorder, newGameText],
                        scale: 1.1,
                        duration: 100,
                        ease: 'Sine.Out'
                    });
                    newGameBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
                });
                
                newGameBorder.on('pointerout', () => {
                    newGameText.setStyle({ fill: '#ffffff' });
                    this.tweens.add({
                        targets: [newGameBorder, newGameText],
                        scale: 1,
                        duration: 100,
                        ease: 'Sine.Out'
                    });
                    newGameBorder.setStrokeStyle(2, 0xffffff, 0.7);
                });
                
                // Hover effects for Main Menu button
                exitBorder.on('pointerover', () => {
                    exitText.setStyle({ fill: '#ffffcc' });  // Slightly yellow chalk when hovered
                    this.tweens.add({
                        targets: [exitBorder, exitText],
                        scale: 1.1,
                        duration: 100,
                        ease: 'Sine.Out'
                    });
                    exitBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
                });
                
                exitBorder.on('pointerout', () => {
                    exitText.setStyle({ fill: '#ffffff' });
                    this.tweens.add({
                        targets: [exitBorder, exitText],
                        scale: 1,
                        duration: 100,
                        ease: 'Sine.Out'
                    });
                    exitBorder.setStrokeStyle(2, 0xffffff, 0.7);
                });
                
                // Button actions with enhanced click effects
                newGameBorder.on('pointerdown', () => {
                    // Click effect with sound
                    this.tweens.add({
                        targets: [newGameBorder, newGameText],
                        scale: 0.9,
                        duration: 100,
                        yoyo: true,
                        onComplete: () => this.resetGame()
                    });
                });
                
                exitBorder.on('pointerdown', () => {
                    // Click effect with sound
                    this.tweens.add({
                        targets: [exitBorder, exitText],
                        scale: 0.9,
                        duration: 100,
                        yoyo: true,
                        onComplete: () => this.returnToMainMenu()
                    });
                });
            });
        } catch (error) {
            console.error('Error showing game results:', error);
            this.returnToMainMenu();
        }
    }
    
    createCelebrationEffect(isHighScore) {
        try {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            if (!this.wordDisplay || !this.characterImage) {
                console.warn('Required game objects missing in createChalkboardCelebration');
                return;
            }
            
            // Enhanced color palette for more vibrant chalk effects
            const chalkColors = [
                '#ffffff', // White
                '#ffffcc', // Light yellow
                '#ffccff', // Light pink
                '#ccffff', // Light blue
                '#ffffaa', // Creamy yellow
                '#ffaacc', // Pink
                '#aaccff', // Light blue
                '#ffcc88', // Light orange
                '#ccff88', // Light green
                '#ff88ff'  // Bright pink
            ];
            
            // Function to get a random chalk color
            const getRandomChalkColor = () => chalkColors[Math.floor(Math.random() * chalkColors.length)];
            
            // Create chalk-like particles using circles instead of star sprites
            const createChalkParticles = (x, y, count, color = '#ffffff', scale = 1) => {
                try {
                    for (let i = 0; i < count; i++) {
                        // Random position around the center point
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * 100 * scale;
                        const particleX = x + Math.cos(angle) * distance;
                        const particleY = y + Math.sin(angle) * distance;
                        
                        // Create a small chalk dot
                        const particle = this.add.circle(
                            particleX,
                            particleY,
                            1 + Math.random() * 2 * scale,
                            Phaser.Display.Color.HexStringToColor(color).color,
                            0.8
                        );
                        
                        // Add movement and fade animation
                        this.tweens.add({
                            targets: particle,
                            x: particleX + (Math.random() * 60 - 30) * scale,
                            y: particleY + (Math.random() * 60 - 30) * scale,
                            alpha: 0,
                            scale: { from: 1, to: 0.2 },
                            duration: 1000 + Math.random() * 1000,
                            onComplete: () => particle.destroy()
                        });
                    }
                } catch (err) {
                    console.error('Error creating chalk particles:', err);
                }
            };
            
            // Create chalk dust around the word
            createChalkParticles(this.wordDisplay.x, this.wordDisplay.y, 30, getRandomChalkColor());
            
            // Create chalk dust around the character
            createChalkParticles(this.characterImage.x, this.characterImage.y, 40, getRandomChalkColor());
            
            // Create a chalk dust burst animation (firework effect)
            const createChalkBurst = (x, y, color = '#ffffff', scale = 1) => {
                try {
                    const burstLines = [];
                    const lineCount = 10 + Math.floor(Math.random() * 8); // Increased line count
                    
                    // Create burst lines radiating from center
                    for (let i = 0; i < lineCount; i++) {
                        const angle = (i / lineCount) * Math.PI * 2;
                        const lineLength = (30 + Math.random() * 40) * scale; // Increased length variation
                        
                        // Create line starting points
                        const startX = x + Math.cos(angle) * 5;
                        const startY = y + Math.sin(angle) * 5;
                        
                        // Create end points
                        const endX = x + Math.cos(angle) * lineLength;
                        const endY = y + Math.sin(angle) * lineLength;
                        
                        // Draw the line
                        const line = this.add.line(
                            0, 0,
                            startX, startY,
                            endX, endY,
                            Phaser.Display.Color.HexStringToColor(color).color,
                            0.8 // Increased opacity
                        );
                        line.setLineWidth(1 + Math.random() * 2 * scale);
                        
                        burstLines.push(line);
                        
                        // Animate the line growing from center
                        this.tweens.add({
                            targets: line,
                            alpha: { from: 0.8, to: 0 },
                            duration: 700 + Math.random() * 500, // Longer duration for better visibility
                            onComplete: () => line.destroy()
                        });
                        
                        // Add particles along the lines for extra effect
                        if (Math.random() > 0.5) {
                            const particleX = x + Math.cos(angle) * lineLength * 0.7;
                            const particleY = y + Math.sin(angle) * lineLength * 0.7;
                            
                            const sparkle = this.add.circle(
                                particleX, particleY,
                                2 + Math.random() * 2,
                                Phaser.Display.Color.HexStringToColor(getRandomChalkColor()).color,
                                0.9
                            );
                            
                            this.tweens.add({
                                targets: sparkle,
                                alpha: 0,
                                scale: { from: 1.5, to: 0.2 },
                                duration: 600 + Math.random() * 400,
                                onComplete: () => sparkle.destroy()
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error creating chalk burst:', err);
                }
            };
            
            // Create multiple chalk bursts with slight delays
            // Increased the number of bursts and added variation in placement
            for (let i = 0; i < 8; i++) { // Increased from 5 to 8 bursts
                this.time.delayedCall(i * 250, () => {
                    try {
                        // More varied positions
                        const x = width * 0.3 + Math.random() * width * 0.4;
                        const y = height * 0.2 + Math.random() * height * 0.4;
                        
                        // Random color from enhanced chalk palette
                        const color = getRandomChalkColor();
                        const scale = 0.8 + Math.random() * 0.8; // Varied sizes
                        
                        createChalkBurst(x, y, color, scale);
                        createChalkParticles(x, y, 15 + Math.floor(Math.random() * 10), color);
                    } catch (err) {
                        console.error('Error in chalk burst delayed call:', err);
                    }
                });
            }
            
            // Add more firework effects specifically around the character
            for (let i = 0; i < 3; i++) {
                this.time.delayedCall(i * 400 + 200, () => {
                    try {
                        const x = this.characterImage.x + (Math.random() * 200 - 100);
                        const y = this.characterImage.y + (Math.random() * 200 - 100);
                        const color = getRandomChalkColor();
                        
                        createChalkBurst(x, y, color, 1.2);
                        
                        // Add extra particles for more visual impact
                        createChalkParticles(x, y, 25, color, 1.3);
                    } catch (err) {
                        console.error('Error in character burst effect:', err);
                    }
                });
            }
            
            // Create chalk circles that expand outward
            for (let i = 0; i < 4; i++) { // Increased from 3 to 4
                this.time.delayedCall(i * 250, () => {
                    try {
                        // Add circles at both word and character positions
                        const positions = [
                            { x: this.wordDisplay.x, y: this.wordDisplay.y },
                            { x: this.characterImage.x, y: this.characterImage.y },
                            { x: width/2, y: height/2 }
                        ];
                        
                        const pos = positions[i % positions.length];
                        const color = Phaser.Display.Color.HexStringToColor(getRandomChalkColor()).color;
                        
                        const circle = this.add.circle(
                            pos.x,
                            pos.y,
                            5,
                            color,
                            0.5
                        );
                        circle.setStrokeStyle(2, color, 0.7);
                        
                        this.tweens.add({
                            targets: circle,
                            radius: 100 + Math.random() * 50,
                            alpha: 0,
                            duration: 1000 + Math.random() * 500,
                            ease: 'Cubic.Out',
                            onComplete: () => circle.destroy()
                        });
                    } catch (err) {
                        console.error('Error creating expanding circle:', err);
                    }
                });
            }
            
            // Add floating "sparks" for extra flair
            for (let i = 0; i < 20; i++) {
                this.time.delayedCall(Math.random() * 1500, () => {
                    try {
                        const x = width * 0.2 + Math.random() * width * 0.6;
                        const y = height * 0.2 + Math.random() * height * 0.6;
                        
                        const spark = this.add.circle(
                            x, y,
                            1 + Math.random() * 2,
                            Phaser.Display.Color.HexStringToColor(getRandomChalkColor()).color,
                            0.9
                        );
                        
                        this.tweens.add({
                            targets: spark,
                            x: x + (Math.random() * 80 - 40),
                            y: y - 40 - Math.random() * 40, // Float upward
                            alpha: 0,
                            scale: { from: 1, to: 0 },
                            duration: 1200 + Math.random() * 800,
                            ease: 'Sine.Out',
                            onComplete: () => spark.destroy()
                        });
                    } catch (err) {
                        console.error('Error creating floating spark:', err);
                    }
                });
            }
        } catch (error) {
            console.error('Error in createChalkboardCelebration:', error);
        }
    }

    getRandomBrightColor() {
        const colors = [
            '#ffff00', // Yellow
            '#ff00ff', // Magenta
            '#00ffff', // Cyan
            '#ff8800', // Orange
            '#88ff00', // Lime
            '#ff0088', // Pink
            '#ffffff'  // White
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    resetGame() {
        // Clean up any existing game elements
        this.cleanupGame();
        
        // Reset game state
        this.currentCharacterIndex = 0;
        this.characterScores = [];
        this.usedCharacters = [];
        this.mistakes = 0;
        
        // Start a new character
        try {
            // Get current dimensions
            const width = this.scale.gameSize.width;
            const height = this.scale.gameSize.height;
            
            // Set background with proper positioning
            this.background = this.add.image(width / 2, height / 2, 'chalkboard')
                .setOrigin(0.5)
                .setDisplaySize(width, height);
            
            // Create basic UI elements 
            this.createUI(width, height);
            
            // Then start first character
            this.startNewCharacter();
        } catch (error) {
            console.error('Error resetting game:', error);
            // Recover by returning to main menu
            this.scene.start('MainMenu');
        }
    }
    
    saveHighScore(score) {
        // Get existing high score
        this.getHighScore().then(highScore => {
            // Only save if the new score is higher
            if (score > highScore) {
                // Use IndexedDB to save the high score
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
                    const transaction = db.transaction(['gameScores'], 'readwrite');
                    const store = transaction.objectStore('gameScores');
                    
                    // Store the high score
                    const scoreData = {
                        id: 'highScore',
                        score: score,
                        date: new Date().toISOString()
                    };
                    
                    store.put(scoreData);
                    
                    console.log('High score saved:', score);
                };
                
                request.onerror = (event) => {
                    console.error('Error saving high score:', event.target.error);
                };
            }
        });
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
    
    cleanupCompletionElements() {
        // Destroy all completion screen elements
        this.completionElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.completionElements = [];
    }

    setupKeyboardInput() {
        // Add keyboard input for letters if enabled
        this.input.keyboard.on('keydown', (event) => {
            if (/^[a-zA-Z]$/.test(event.key)) {
                this.handleLetterSelection(event.key);
            }
        });
    }

    shuffleArray(array) {
        // Fisher-Yates shuffle algorithm
        let currentIndex = array.length, randomIndex;
        
        // While there remain elements to shuffle
        while (currentIndex !== 0) {
            // Pick a remaining element
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            
            // And swap it with the current element
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        
        return array;
    }

    cleanupGame() {
        try {
            // Clear wrong letters tracking first to avoid errors in update cycle
            this.wrongLetters = [];
            
            // Clean up any existing elements that might be left over from a previous game
            if (this.letterButtons && this.letterButtons.length > 0) {
                this.letterButtons.forEach(button => {
                    if (button && button.destroy) {
                        button.destroy();
                    }
                });
                this.letterButtons = [];
            }
            
            // Clean up permanent borders
            if (this.permanentBorders && this.permanentBorders.length > 0) {
                this.permanentBorders.forEach(border => {
                    if (border && border.destroy) {
                        border.destroy();
                    }
                });
                this.permanentBorders = [];
            }
            
            if (this.completionElements && this.completionElements.length > 0) {
                this.cleanupCompletionElements();
            }
            
            if (this.characterImage && this.characterImage.destroy) {
                this.characterImage.destroy();
                this.characterImage = null;
            }
            
            if (this.letterContainer && this.letterContainer.destroy) {
                this.letterContainer.destroy();
                this.letterContainer = null;
            }
            
            if (this.wordDisplay && this.wordDisplay.destroy) {
                this.wordDisplay.destroy();
                this.wordDisplay = null;
            }
            
            // Clean up UI elements
            if (this.progressText && this.progressText.destroy) {
                this.progressText.destroy();
                this.progressText = null;
            }
            
            // Clean up any remaining game objects that might be lingering
            this.tweens.killAll();
            
            if (this.hintLetters && this.hintLetters.length > 0) {
                this.hintLetters = [];
            }
            
            // Force destroy all particles if any exist
            this.children.each(child => {
                if (child.type === 'ParticleEmitterManager') {
                    child.destroy();
                }
            });
            
            // Clear the scene's display list to be thorough
            this.children.each(child => {
                if (child.type === 'Text' || child.type === 'Image' || 
                    child.type === 'Graphics' || child.type === 'Container' ||
                    child.type === 'Rectangle' || child.type === 'Circle') {
                    child.destroy();
                }
            });

            // Clear any remaining UI elements from the map
            if (this.uiElements) {
                this.uiElements.forEach((element) => {
                    if (element && element.destroy) {
                        element.destroy();
                    }
                });
                this.uiElements.clear();
            }
        } catch (error) {
            console.error('Error in cleanupGame:', error);
        }
    }

    // Safe method to return to main menu
    returnToMainMenu() {
        try {
            // Clean up all game elements first
            this.cleanupGame();
            // Then transition to main menu
            this.scene.start('MainMenu');
        } catch (error) {
            console.error('Error returning to main menu:', error);
            // Try a more direct approach as a fallback
            this.scene.stop();
            this.scene.start('MainMenu');
        }
    }

    // Simple function to ensure background covers the screen
    updateBackground(gameSize) {
        if (this.background) {
            this.background.setPosition(gameSize.width / 2, gameSize.height / 2)
                .setDisplaySize(gameSize.width, gameSize.height);
        }
    }

    shutdown() {
        // Remove the update event
        if (this.events) {
            this.events.off('update', this.updateWrongLetterBorders, this);
        }
        
        // Clean up event listeners
        this.scale.off('resize', this.updateBackground, this);
        
        // Clean up other resources
        this.cleanupGame();
    }

    updateWrongLetterBorders() {
        try {
            // Force redraw borders for all wrong letters
            this.wrongLetters.forEach(letterObj => {
                if (letterObj && letterObj.permanentBorder && 
                    letterObj.permanentBorder.visible !== undefined) {
                    // Ensure permanent border is visible with white color
                    letterObj.permanentBorder.alpha = 1;
                    letterObj.permanentBorder.visible = true;
                    
                    // Keep stroke style maintained
                    if (!letterObj.isAnimating) {
                        letterObj.permanentBorder.setStrokeStyle(2, 0xffffff, 0.9);
                    }
                }
            });
        } catch (error) {
            console.error('Error in updateWrongLetterBorders:', error);
        }
    }

    // Helper function to play sounds safely
    playSound(soundKey) {
        try {
            if (this.soundEnabled && this.sounds && this.sounds[soundKey]) {
                this.sounds[soundKey].play();
            }
        } catch (error) {
            console.error('Error playing sound:', soundKey, error);
        }
    }
}

export default Game; 