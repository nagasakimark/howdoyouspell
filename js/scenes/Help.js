class Help extends Phaser.Scene {
    constructor() {
        super({ key: 'Help' });
    }

    create() {
        const width = this.scale.gameSize.width;
        const height = this.scale.gameSize.height;

        // Add background - still cover full screen
        this.background = this.add.image(width / 2, height / 2, 'chalkboard')
            .setDisplaySize(width, height);
            
        // Make background responsive to canvas size changes
        this.scale.on('resize', this.updateBackground, this);

        // Create panel
        const panelWidth = Math.min(width * 0.8, 800);
        const panelHeight = Math.min(height * 0.8, 600);
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2;

        // Add title
        const title = this.add.text(width / 2, panelY + 80, 'HELP', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add Japanese instructions with white text
        const instructions = this.add.text(width / 2, height / 2, [
            "1. キャラクターの画像が表示されます。",
            "2. 文字をクリックして名前を正しくつづりましょう。",
            "3. 全ての文字が正しいわけではありません。気をつけてください。",
            "4. 3回間違えるとヒントが表示されます。",
            "5. スピードと正確さによって最大10,000点のスコアがつきます。"
        ].join('\n'), {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#ffffff',
            align: 'left',
            lineSpacing: 15
        }).setOrigin(0.5);

        // Add back button with chalk-style border
        const backButtonWidth = 180;
        const backButtonHeight = 70;
        
        // Create back button border
        const backButtonBorder = this.add.rectangle(
            width / 2,
            height - 80,
            backButtonWidth,
            backButtonHeight,
            0x000000,
            0
        );
        backButtonBorder.setOrigin(0.5);
        backButtonBorder.setStrokeStyle(3, 0xffffff, 0.8); // White chalk border
        backButtonBorder.setInteractive({ useHandCursor: true });
        
        // Create back button text
        const backButton = this.add.text(width / 2, height - 80, 'BACK', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Back button hover and click effects
        backButtonBorder.on('pointerover', () => {
            backButton.setStyle({ fill: '#ffffcc' });
            backButtonBorder.setStrokeStyle(4, 0xffffff, 0.9);
            backButton.setScale(1.05);
        });
        
        backButtonBorder.on('pointerout', () => {
            backButton.setStyle({ fill: '#ffffff' });
            backButtonBorder.setStrokeStyle(3, 0xffffff, 0.8);
            backButton.setScale(1);
        });
        
        backButtonBorder.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
        
        // Add QR code button with chalk-style border
        const qrButtonWidth = 80;
        const qrButtonHeight = 60;
        
        // Create QR button border
        const qrButtonBorder = this.add.rectangle(
            width - 80,
            height - 80,
            qrButtonWidth,
            qrButtonHeight,
            0x000000,
            0
        );
        qrButtonBorder.setOrigin(0.5);
        qrButtonBorder.setStrokeStyle(3, 0xffffff, 0.8); // White chalk border
        qrButtonBorder.setInteractive({ useHandCursor: true });
        
        // Create QR button text
        const qrButton = this.add.text(width - 80, height - 80, 'QR', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // QR button hover and click effects
        qrButtonBorder.on('pointerover', () => {
            qrButton.setStyle({ fill: '#ffffcc' });
            qrButtonBorder.setStrokeStyle(4, 0xffffff, 0.9);
            qrButton.setScale(1.05);
        });
        
        qrButtonBorder.on('pointerout', () => {
            qrButton.setStyle({ fill: '#ffffff' });
            qrButtonBorder.setStrokeStyle(3, 0xffffff, 0.8);
            qrButton.setScale(1);
        });
        
        qrButtonBorder.on('pointerdown', () => {
            this.showQRCode();
        });

        // Store elements for access in other methods
        this.elements = { title, instructions, backButton, backButtonBorder, qrButton, qrButtonBorder };
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
    
    showQRCode() {
        const { width, height } = this.scale.gameSize;
        
        // Create overlay background
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive()
            .on('pointerdown', () => {
                // Remove QR code display
                overlay.destroy();
                qrImage.destroy();
                closeButton.destroy();
                closeBorder.destroy();
            });
            
        // Display QR code
        const qrImage = this.add.image(width / 2, height / 2, 'qrcode')
            .setOrigin(0.5);
            
        // Scale QR code to fit screen
        const scale = Math.min(width * 0.8 / qrImage.width, height * 0.8 / qrImage.height);
        qrImage.setScale(scale);
        
        // Add close button with border
        const closeBorder = this.add.rectangle(
            width - 60,
            60,
            80,
            80,
            0x000000,
            0
        );
        closeBorder.setOrigin(0.5);
        closeBorder.setStrokeStyle(3, 0xffffff, 0.8);
        closeBorder.setInteractive({ useHandCursor: true });
        
        // Close button text
        const closeButton = this.add.text(width - 60, 60, 'X', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Close button hover effects
        closeBorder.on('pointerover', () => {
            closeButton.setStyle({ fill: '#ffffcc' });
            closeBorder.setStrokeStyle(4, 0xffffff, 0.9);
        });
        
        closeBorder.on('pointerout', () => {
            closeButton.setStyle({ fill: '#ffffff' });
            closeBorder.setStrokeStyle(3, 0xffffff, 0.8);
        });
        
        closeBorder.on('pointerdown', () => {
            overlay.destroy();
            qrImage.destroy();
            closeButton.destroy();
            closeBorder.destroy();
        });
    }
}

export default Help; 