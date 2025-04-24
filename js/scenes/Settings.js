class Settings extends Phaser.Scene {
    constructor() {
        super({ key: 'Settings' });
    }

    create() {
        // Set background
        this.add.image(0, 0, 'chalkboard').setOrigin(0).setDisplaySize(window.innerWidth, window.innerHeight);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Use the ChalkFont directly
        const fontFamily = 'ChalkFont, Arial';
        
        // Add settings title
        const title = this.add.text(width / 2, height / 6, 'SETTINGS', {
            font: `48px ${fontFamily}`,
            fill: '#ffffff',  // White chalk
            stroke: '#ffffff',  // White chalk outline
            strokeThickness: 1,
            shadow: { offsetX: 1, offsetY: 1, color: '#333333', blur: 1, fill: true }
        });
        title.setOrigin(0.5);
        
        // Add a simple panel with a chalk-like border
        const panelWidth = 500;
        const panelHeight = 300; // Reduced height since we're removing volume slider
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2 + 20;
        
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
        
        // Keyboard option
        const keyboardText = this.add.text(width / 2 - 150, height / 3, 'Enable Keyboard:', {
            font: `24px ${fontFamily}`,
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeThickness: 0.5
        });
        
        // Create a chalk-style checkbox
        const checkboxSize = 30;
        const checkboxX = width / 2 + 100;
        const checkboxY = height / 3;
        
        // Checkbox border
        const checkboxBorder = this.add.rectangle(
            checkboxX,
            checkboxY,
            checkboxSize,
            checkboxSize,
            0x000000,
            0
        );
        checkboxBorder.setStrokeStyle(2, 0xffffff, 0.8);
        checkboxBorder.setInteractive({ useHandCursor: true });
        
        // Checkbox mark (X)
        const checkMark = this.add.text(
            checkboxX,
            checkboxY,
            'X',
            {
                font: `${checkboxSize}px ${fontFamily}`,
                fill: '#ffffff'
            }
        );
        checkMark.setOrigin(0.5);
        checkMark.visible = window.gameSettings && window.gameSettings.keyboardEnabled;
        
        // Toggle checkbox
        checkboxBorder.on('pointerdown', () => {
            if (!window.gameSettings) {
                window.gameSettings = {};
            }
            window.gameSettings.keyboardEnabled = !window.gameSettings.keyboardEnabled;
            checkMark.visible = window.gameSettings.keyboardEnabled;
        });
        
        // Letter case option
        const caseText = this.add.text(width / 2 - 150, height / 3 + 70, 'Letter Case:', {
            font: `24px ${fontFamily}`,
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeThickness: 0.5
        });
        
        // Dropdown for letter case
        const caseOptions = ['UPPERCASE', 'lowercase', 'Mixed Case'];
        let currentCaseIndex = (window.gameSettings && window.gameSettings.uppercase) ? 0 : 
                               (window.gameSettings && window.gameSettings.lowercase) ? 1 : 2;
        
        // Chalk-style dropdown
        const caseButton = this.add.text(
            width / 2 + 100, 
            height / 3 + 70, 
            caseOptions[currentCaseIndex], 
            {
                font: `24px ${fontFamily}`,
                fill: '#ffffff',
                stroke: '#ffffff',
                strokeThickness: 0.5
            }
        );
        caseButton.setOrigin(0.5);
        
        // Add a chalk border around the dropdown
        const caseButtonBorder = this.add.rectangle(
            width / 2 + 100,
            height / 3 + 70,
            caseButton.width + 20,
            caseButton.height + 10,
            0x000000,
            0
        );
        caseButtonBorder.setStrokeStyle(2, 0xffffff, 0.8);
        caseButtonBorder.setInteractive({ useHandCursor: true });
        caseButtonBorder.depth = 0;
        caseButton.depth = 1;
        
        // Toggle case setting
        caseButtonBorder.on('pointerdown', () => {
            currentCaseIndex = (currentCaseIndex + 1) % caseOptions.length;
            caseButton.setText(caseOptions[currentCaseIndex]);
            caseButtonBorder.width = caseButton.width + 20;
            
            // Update game settings
            if (!window.gameSettings) {
                window.gameSettings = {};
            }
            window.gameSettings.uppercase = currentCaseIndex === 0;
            window.gameSettings.lowercase = currentCaseIndex === 1;
            // Mixed case is when both are false
            if (currentCaseIndex === 2) {
                window.gameSettings.uppercase = false;
                window.gameSettings.lowercase = false;
            }
        });
        
        // Back button - positioned within the panel border
        const backButtonWidth = 180;
        const backButtonHeight = 60;
        
        // Create button border (no background, just a white border)
        const backButtonBorder = this.add.rectangle(
            width / 2, 
            panelY + panelHeight - 60, // Position within the panel border
            backButtonWidth, 
            backButtonHeight, 
            0x000000, 
            0
        );
        backButtonBorder.setOrigin(0.5);
        backButtonBorder.setStrokeStyle(2, 0xffffff, 0.8); // White chalk border
        backButtonBorder.setInteractive({ useHandCursor: true });
        
        // Create button text
        const backButtonText = this.add.text(
            width / 2, 
            panelY + panelHeight - 60, // Match the button position
            'BACK', 
            {
                font: `32px ${fontFamily}`,
                fill: '#ffffff',
                stroke: '#ffffff',
                strokeThickness: 0.5
            }
        );
        backButtonText.setOrigin(0.5);
        
        // Button hover and click effects
        backButtonBorder.on('pointerover', () => {
            backButtonText.setFill('#ffffcc');
            backButtonBorder.setStrokeStyle(3, 0xffffff, 0.9);
            backButtonText.setScale(1.05);
        });
        
        backButtonBorder.on('pointerout', () => {
            backButtonText.setFill('#ffffff');
            backButtonBorder.setStrokeStyle(2, 0xffffff, 0.8);
            backButtonText.setScale(1);
        });
        
        backButtonBorder.on('pointerdown', () => {
            // Click animation
            this.tweens.add({
                targets: [backButtonText, backButtonBorder],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => this.scene.start('MainMenu')
            });
        });
    }
}

// Explicitly add to window object
window.Settings = Settings; 