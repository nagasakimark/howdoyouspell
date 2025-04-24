class Help extends Phaser.Scene {
    constructor() {
        super({ key: 'Help' });
    }

    create() {
        // Set background
        this.add.image(0, 0, 'chalkboard').setOrigin(0).setDisplaySize(window.innerWidth, window.innerHeight);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Use the ChalkFont directly
        const fontFamily = 'ChalkFont, Arial';
        
        // Add help title in English
        const title = this.add.text(width / 2, height / 6, 'HELP', {
            font: `48px ${fontFamily}`,
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeThickness: 1,
            shadow: { offsetX: 1, offsetY: 1, color: '#333333', blur: 1, fill: true },
            resolution: 2 // Better text rendering
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
        
        // Add a simple panel with a chalk-like border
        const panelWidth = 750;
        const panelHeight = 450;
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
        
        // Japanese Instructions (Simple)
        const japaneseTitle = this.add.text(width / 2, panelY + 60, 'ゲームの目的:', {
            font: `36px ${fontFamily}`,
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeThickness: 0.5,
            resolution: 2 // Better text rendering
        });
        japaneseTitle.setOrigin(0.5);
        
        const japaneseInstructions = [
            "1. キャラクターの画像が表示されます。",
            "2. 文字をクリックして名前を正しくつづりましょう。",
            "3. 全ての文字が正しいわけではありません。気をつけてください。",
            "4. 3回間違えるとヒントが表示されます。",
            "5. スピードと正確さによって最大10,000点のスコアがつきます。"
        ];
        
        let yPos = panelY + 120;
        japaneseInstructions.forEach(instruction => {
            const text = this.add.text(width / 2, yPos, instruction, {
                font: `24px ${fontFamily}`,
                fill: '#ffffff',
                stroke: '#ffffff',
                strokeThickness: 0.5,
                resolution: 2 // Better text rendering
            });
            text.setOrigin(0.5);
            yPos += 40;
        });
        
        // Back button within the panel
        const backButtonWidth = 180;
        const backButtonHeight = 60;
        
        // Create button border (no background, just a white border)
        const backButtonBorder = this.add.rectangle(
            width / 2,
            panelY + panelHeight - 60,
            backButtonWidth,
            backButtonHeight,
            0x000000,
            0
        );
        backButtonBorder.setOrigin(0.5);
        backButtonBorder.setStrokeStyle(2, 0xffffff, 0.8); // White chalk border
        backButtonBorder.setInteractive({ useHandCursor: true });
        
        const backButton = this.add.text(width / 2, panelY + panelHeight - 60, 'BACK', {
            font: `32px ${fontFamily}`,
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeThickness: 0.5,
            resolution: 2 // Better text rendering
        });
        backButton.setOrigin(0.5);
        
        // Button hover and click effects
        backButtonBorder.on('pointerover', () => {
            backButton.setFill('#ffffcc');
            backButtonBorder.setStrokeStyle(3, 0xffffff, 0.9);
            backButton.setScale(1.05);
        });
        
        backButtonBorder.on('pointerout', () => {
            backButton.setFill('#ffffff');
            backButtonBorder.setStrokeStyle(2, 0xffffff, 0.8);
            backButton.setScale(1);
        });
        
        backButtonBorder.on('pointerdown', () => {
            // Click animation
            this.tweens.add({
                targets: [backButton, backButtonBorder],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => this.scene.start('MainMenu')
            });
        });
        
        // Add QR code button on bottom right
        const qrButtonSize = 50;
        const qrButtonX = width - qrButtonSize - 20; // 20px margin from right edge
        const qrButtonY = height - qrButtonSize - 20; // 20px margin from bottom edge
        
        // Create circular button with "QR" text
        const qrBorder = this.add.circle(
            qrButtonX,
            qrButtonY,
            qrButtonSize / 2,
            0x000000,
            0
        );
        qrBorder.setStrokeStyle(2, 0xffffff, 0.8); // White chalk border
        qrBorder.setInteractive({ useHandCursor: true });
        
        const qrText = this.add.text(qrButtonX, qrButtonY, 'QR', {
            font: `24px ${fontFamily}`,
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeThickness: 0.5,
            resolution: 2 // Better text rendering
        });
        qrText.setOrigin(0.5);
        
        // Button hover and click effects
        qrBorder.on('pointerover', () => {
            qrText.setFill('#ffffcc');
            qrBorder.setStrokeStyle(3, 0xffffff, 0.9);
            qrText.setScale(1.05);
        });
        
        qrBorder.on('pointerout', () => {
            qrText.setFill('#ffffff');
            qrBorder.setStrokeStyle(2, 0xffffff, 0.8);
            qrText.setScale(1);
        });
        
        qrBorder.on('pointerdown', () => {
            // Show QR code overlay
            this.showQRCodeOverlay();
        });
    }
    
    showQRCodeOverlay() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create semi-transparent dark overlay
        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.8
        );
        overlay.setOrigin(0.5);
        overlay.setInteractive();
        
        // Display QR code image
        const qrSize = Math.min(width, height) * 0.7; // 70% of screen size
        const qrCode = this.add.image(
            width / 2,
            height / 2,
            'qrcode'
        );
        
        // Scale QR code to fit the screen
        const scale = qrSize / Math.max(qrCode.width, qrCode.height);
        qrCode.setScale(scale);
        
        // Add text below the QR code
        const urlText = this.add.text(
            width / 2,
            height / 2 + (qrSize / 2) + 30,
            'https://nagasakimark.github.io/howdoyouspell',
            {
                font: '24px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                resolution: 2 // Better text rendering
            }
        );
        urlText.setOrigin(0.5);
        
        // Add instruction to click anywhere to close
        const closeText = this.add.text(
            width / 2,
            height / 2 + (qrSize / 2) + 70,
            'Click anywhere to close',
            {
                font: '20px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                resolution: 2 // Better text rendering
            }
        );
        closeText.setOrigin(0.5);
        
        // Click anywhere to close
        overlay.on('pointerdown', () => {
            overlay.destroy();
            qrCode.destroy();
            urlText.destroy();
            closeText.destroy();
        });
    }
}

// Explicitly add to window object
window.Help = Help; 