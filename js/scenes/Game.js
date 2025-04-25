class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
        this.uiElements = new Map();
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
        
        // Use the chalk font directly
        this.fontFamily = window.chalkFontLoaded ? 'ChalkFont, Arial' : 'Arial';
        console.log(`Game init using font: ${this.fontFamily}, chalkFontLoaded: ${window.chalkFontLoaded}`);
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
        } catch (error) {
            console.error('Error in Game scene create:', error);
            // Try to recover by going back to main menu
            this.scene.start('MainMenu');
        }
    }

    startNewCharacter() {
        try {
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
            
            if (!this.characterImage) {
                // First time - create the image
                // Moved character position down to avoid overlap with title during animation
                this.characterImage = this.add.image(width / 2, height * 0.4, textureToUse);
                this.characterImage.setOrigin(0.5);
            } else {
                // Update existing image
                this.characterImage.setTexture(textureToUse);
                this.characterImage.visible = true;
                // Update position to match new positioning
                this.characterImage.setPosition(width / 2, height * 0.4);
            }
            
            // Scale image to fit properly
            this.scaleCharacterImage(textureToUse);
            
            // Make sure word display is visible and empty
            if (this.wordDisplay) {
                this.wordDisplay.setText('');
                this.wordDisplay.visible = true;
            }
            
            // Reset the current word
            this.currentWord = '';
            
            // Reset mistakes for this character
            this.mistakes = 0;
            
            // Generate letter buttons for the word
            this.generateLetterButtons();
            
            // Start timer for this character
            this.startTime = Date.now();
            
            // Update the progress display
            this.updateProgressDisplay();
        } catch (error) {
            console.error('Error in startNewCharacter:', error);
            this.returnToMainMenu();
        }
    }
    
    updateProgressDisplay() {
        if (this.progressText) {
            this.progressText.setText(`Character ${this.currentCharacterIndex + 1}/${this.totalCharacters}`);
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
        
        // Select a random character that hasn't been used yet in this round
        let availableCharacters = window.characters.filter(char => 
            !this.usedCharacters.includes(char.name.toLowerCase())
        );
        
        // If all characters have been used, reset the pool
        if (availableCharacters.length === 0) {
            console.log('All characters used, resetting character pool');
            availableCharacters = window.characters;
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
        
        // Create chalk-style letter buttons
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < buttonsPerRow; c++) {
                const index = r * buttonsPerRow + c;
                if (index >= allLetters.length) continue;
                
                const letter = allLetters[index];
                
                // Calculate position
                const x = gridX + c * buttonSpacing;
                const y = gridY + r * buttonSpacing;
                
                // Create letter circle border
                const buttonBorder = this.add.circle(
                    x,
                    y,
                    buttonSize / 1.8,
                    0x000000,
                    0
                );
                buttonBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
                
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
                
                // Store style info for later updates
                button.setData('normalFont', `${normalFontSize}px`);
                button.setData('hoverFont', `${hoverFontSize}px`);
                
                // Make interactive
                button.setInteractive({ useHandCursor: true });
                buttonBorder.setInteractive({ useHandCursor: true });
                
                // Button hover effects
                const hoverButton = () => {
                    button.setStyle({ 
                        font: `${button.getData('hoverFont')} ${this.fontFamily}`,
                        fill: '#ffffcc',  // Slightly yellow chalk when hovered
                        stroke: '#ffffff',
                        strokeThickness: 1,
                        resolution: 2  // Add higher resolution for crisper text rendering
                    });
                    
                    // Simple scale animation on hover
                    button.setScale(1.05);
                    buttonBorder.setScale(1.05);
                    buttonBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
                };
                
                const normalButton = () => {
                    button.setStyle({ 
                        font: `${button.getData('normalFont')} ${this.fontFamily}`,
                        fill: '#ffffff',  // White chalk
                        stroke: '#ffffff',
                        strokeThickness: 0.5,
                        resolution: 2  // Add higher resolution for crisper text rendering
                    });
                    
                    // Reset scale
                    button.setScale(1);
                    buttonBorder.setScale(1);
                    buttonBorder.setStrokeStyle(2, 0xffffff, 0.7);
                };
                
                button.on('pointerover', hoverButton);
                button.on('pointerout', normalButton);
                
                buttonBorder.on('pointerover', hoverButton);
                buttonBorder.on('pointerout', normalButton);
                
                // Click handler with simple animation
                const handleClick = () => {
                    this.handleLetterSelection(letter);
                    
                    // Add a simple click effect
                    this.tweens.add({
                        targets: [button, buttonBorder],
                        scale: 0.9,
                        duration: 100,
                        yoyo: true,
                        ease: 'Sine.Out',
                        onComplete: () => {
                            button.setScale(1);
                            buttonBorder.setScale(1);
                        }
                    });
                };
                
                button.on('pointerdown', handleClick);
                buttonBorder.on('pointerdown', handleClick);
                
                this.letterButtons.push(button);
                this.letterButtons.push(buttonBorder);
            }
        }
    }

    handleLetterSelection(letter) {
        // Get the next expected letter
        const nextLetter = this.targetWord[this.currentWord.length];
        
        if (letter.toUpperCase() === nextLetter.toUpperCase()) {
            // Correct letter
            this.currentWord += nextLetter; // Add the correct case version
            this.wordDisplay.setText(this.currentWord);
            
            // Reset wrong attempts counter when correct letter is selected
            this.consecutiveWrongAttempts = 0;
            
            // Check if word is complete
            if (this.currentWord.length === this.targetWord.length) {
                // Show sparkle animation before proceeding to completion
                this.showCorrectAnimation();
            }
        } else {
            // Wrong letter - shake the display
            this.tweens.add({
                targets: this.wordDisplay,
                x: this.wordDisplay.x + 10,
                duration: 50,
                yoyo: true,
                repeat: 3
            });
            
            // Increment wrong attempts counter
            this.consecutiveWrongAttempts++;
            
            // Show hint after 3 wrong attempts
            if (this.consecutiveWrongAttempts >= 3) {
                this.showHint();
                // Reset counter after showing hint
                this.consecutiveWrongAttempts = 0;
            }
        }
    }

    showCorrectAnimation() {
        try {
            // Check if the star texture is available
            if (!this.textures.exists('star')) {
                console.warn('Star texture not available for animation, skipping particle effect');
                this.processWordComplete();
                return;
            }
            
            // Create simple star particles
            const particles = this.add.particles('star');
            
            const emitter = particles.createEmitter({
                x: { min: this.characterImage.x - 150, max: this.characterImage.x + 150 },
                y: { min: this.characterImage.y - 150, max: this.characterImage.y + 150 },
                speed: { min: 80, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.2, end: 0 },
                lifespan: 1200,
                blendMode: 'ADD',
                frequency: 50,
                quantity: 1,
                tint: 0xffffff  // White stars
            });
            
            // Simple celebration animation
            this.tweens.add({
                targets: this.wordDisplay,
                scale: 1.2,
                duration: 400,
                yoyo: true,
                repeat: 1,
                ease: 'Sine.Out',
                onComplete: () => {
                    // Clean up animation elements
                    particles.destroy();
                    
                    // Process word completion after animation is done
                    this.processWordComplete();
                }
            });
        } catch (error) {
            console.error('Error in showCorrectAnimation:', error);
            this.processWordComplete();
        }
    }
    
    processWordComplete() {
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
            this.saveHighScore(finalScore);
            
            // Show game completion message
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Create a results panel
            const panelWidth = Math.min(500, width * 0.8);
            const panelHeight = 350;
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
            completionBorder.setStrokeStyle(4, 0xffffff, 0.8);  // White chalk border
            this.completionElements.push(completionBorder);
            
            // Game complete title
            const titleText = this.add.text(
                width / 2, 
                panelY + 70, 
                'GAME COMPLETE!', {
                    font: `46px ${this.fontFamily}`,
                    fill: '#ffffff',  // White chalk
                    stroke: '#ffffff',  // White chalk outline
                    strokeThickness: 1,
                    shadow: { offsetX: 1, offsetY: 1, color: '#333333', blur: 1, fill: true }
                }
            );
            titleText.setOrigin(0.5);
            this.completionElements.push(titleText);
            
            // Add subtle animation to title
            this.tweens.add({
                targets: titleText,
                y: titleText.y - 3,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Show final score
            const scoreText = this.add.text(
                width / 2, 
                panelY + 150, 
                `Final Score: ${finalScore}`, {
                    font: `42px ${this.fontFamily}`,
                    fill: '#ffffff',  // White chalk
                    stroke: '#ffffff',  // White chalk outline
                    strokeThickness: 0.5
                }
            );
            scoreText.setOrigin(0.5);
            this.completionElements.push(scoreText);
            
            // Buttons
            const buttonY = panelY + 250;
            
            // New Game button - made wider
            const newGameBorder = this.add.rectangle(
                width / 2 - 100,
                buttonY,
                180,
                60,
                0x000000,
                0
            );
            newGameBorder.setOrigin(0.5);
            newGameBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
            newGameBorder.setInteractive({ useHandCursor: true });
            this.completionElements.push(newGameBorder);
            
            // Main Menu button - made wider
            const exitBorder = this.add.rectangle(
                width / 2 + 100,
                buttonY,
                180,
                60,
                0x000000,
                0
            );
            exitBorder.setOrigin(0.5);
            exitBorder.setStrokeStyle(2, 0xffffff, 0.7);  // White chalk border
            exitBorder.setInteractive({ useHandCursor: true });
            this.completionElements.push(exitBorder);
            
            // New Game button text
            const newGameText = this.add.text(
                width / 2 - 100, 
                buttonY, 
                'NEW GAME', {
                    font: `28px ${this.fontFamily}`,
                    fill: '#ffffff',  // White chalk
                    stroke: '#ffffff',  // White chalk outline
                    strokeThickness: 0.5
                }
            );
            newGameText.setOrigin(0.5);
            this.completionElements.push(newGameText);
            
            // Main Menu button text
            const exitText = this.add.text(
                width / 2 + 100, 
                buttonY, 
                'MAIN MENU', {
                    font: `28px ${this.fontFamily}`,
                    fill: '#ffffff',  // White chalk
                    stroke: '#ffffff',  // White chalk outline
                    strokeThickness: 0.5
                }
            );
            exitText.setOrigin(0.5);
            this.completionElements.push(exitText);
            
            // Hover effects for New Game button
            newGameBorder.on('pointerover', () => {
                newGameText.setStyle({ fill: '#ffffcc' });  // Slightly yellow chalk when hovered
                newGameText.setScale(1.05);
                newGameBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
            });
            
            newGameBorder.on('pointerout', () => {
                newGameText.setStyle({ fill: '#ffffff' });
                newGameText.setScale(1);
                newGameBorder.setStrokeStyle(2, 0xffffff, 0.7);
            });
            
            // Hover effects for Main Menu button
            exitBorder.on('pointerover', () => {
                exitText.setStyle({ fill: '#ffffcc' });  // Slightly yellow chalk when hovered
                exitText.setScale(1.05);
                exitBorder.setStrokeStyle(3, 0xffffff, 0.9);  // Brighter chalk on hover
            });
            
            exitBorder.on('pointerout', () => {
                exitText.setStyle({ fill: '#ffffff' });
                exitText.setScale(1);
                exitBorder.setStrokeStyle(2, 0xffffff, 0.7);
            });
            
            // Button actions
            newGameBorder.on('pointerdown', () => {
                // Click effect
                this.tweens.add({
                    targets: newGameText,
                    scale: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => this.resetGame()
                });
            });
            
            exitBorder.on('pointerdown', () => {
                // Click effect
                this.tweens.add({
                    targets: exitText,
                    scale: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => this.returnToMainMenu()
                });
            });
        } catch (error) {
            console.error('Error showing game results:', error);
            this.returnToMainMenu();
        }
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
            // Clean up any existing elements that might be left over from a previous game
            if (this.letterButtons && this.letterButtons.length > 0) {
                this.letterButtons.forEach(button => {
                    if (button && button.destroy) {
                        button.destroy();
                    }
                });
                this.letterButtons = [];
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
        // Clean up event listeners
        this.scale.off('resize', this.updateBackground, this);
        
        // Clean up other resources
        this.cleanupGame();
    }
}

export default Game; 