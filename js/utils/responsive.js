// Add this new utility file for responsive scaling
class ResponsiveScale {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.cameras.main.width;
        this.height = scene.cameras.main.height;
        this.initialWidth = 1280; // Base design width
        this.initialHeight = 720; // Base design height
        this.minWidth = 320; // Minimum supported width
        this.minHeight = 480; // Minimum supported height
        this.updateScaleRatio();
        
        // Listen for resize events
        scene.scale.on('resize', this.resize, this);
    }
    
    updateScaleRatio() {
        // Base scale ratio
        this.scaleRatio = Math.min(this.width / this.initialWidth, this.height / this.initialHeight);
        
        // Additional scaling for very small screens
        if (this.width < this.minWidth || this.height < this.minHeight) {
            const smallScreenRatio = Math.min(this.width / this.minWidth, this.height / this.minHeight);
            this.scaleRatio *= smallScreenRatio;
        }
        
        // Ensure minimum scale ratio
        this.scaleRatio = Math.max(this.scaleRatio, 0.3);
    }
    
    resize() {
        this.width = this.scene.cameras.main.width;
        this.height = this.scene.cameras.main.height;
        this.updateScaleRatio();
    }
    
    scaleFontSize(size) {
        // Dynamic minimum font size based on screen dimensions
        const minFontSize = Math.max(12, Math.min(this.width, this.height) * 0.02);
        return Math.max(Math.round(size * this.scaleRatio), minFontSize);
    }
    
    getYPosition(percentPosition) {
        return this.height * percentPosition;
    }
    
    getXPosition(percentPosition) {
        return this.width * percentPosition;
    }
    
    getScaledValue(value) {
        return value * this.scaleRatio;
    }
    
    getMaxWidth() {
        // More conservative max width for very small screens
        const maxWidthPercent = this.width < this.minWidth ? 0.95 : 0.9;
        return this.width * maxWidthPercent;
    }
    
    getMaxHeight() {
        // More conservative max height for very small screens
        const maxHeightPercent = this.height < this.minHeight ? 0.9 : 0.8;
        return this.height * maxHeightPercent;
    }
    
    getPanelDimensions() {
        const maxWidth = this.getMaxWidth();
        const maxHeight = this.getMaxHeight();
        
        // Base panel dimensions
        let panelWidth = Math.min(this.getScaledValue(500), maxWidth);
        let panelHeight = Math.min(this.getScaledValue(400), maxHeight);
        
        // Adjust for very small screens
        if (this.width < this.minWidth || this.height < this.minHeight) {
            panelWidth = Math.min(panelWidth, this.width * 0.95);
            panelHeight = Math.min(panelHeight, this.height * 0.9);
        }
        
        return { width: panelWidth, height: panelHeight };
    }
    
    getButtonDimensions() {
        const baseWidth = 180;
        const baseHeight = 60;
        
        // Dynamic button sizing based on screen size
        let buttonWidth = this.getScaledValue(baseWidth);
        let buttonHeight = this.getScaledValue(baseHeight);
        
        // Minimum button dimensions for touch targets
        const minButtonWidth = Math.max(100, this.width * 0.2);
        const minButtonHeight = Math.max(40, this.height * 0.06);
        
        // Maximum button dimensions
        const maxButtonWidth = this.width * 0.4;
        const maxButtonHeight = this.height * 0.15;
        
        buttonWidth = Math.min(Math.max(buttonWidth, minButtonWidth), maxButtonWidth);
        buttonHeight = Math.min(Math.max(buttonHeight, minButtonHeight), maxButtonHeight);
        
        return { width: buttonWidth, height: buttonHeight };
    }
} 