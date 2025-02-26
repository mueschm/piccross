export class PreloadScene extends Phaser.Scene {
  preload() {
    // Load visual assets
    this.load.image('pattern', 'assets/pattern.png');
    this.load.image('sparkle', 'assets/sparkle.png');
    this.load.spritesheet('confetti', 'assets/confetti.png', { frameWidth: 16, frameHeight: 16 });
    
    // Load fonts
    WebFont.load({
      google: {
        families: ['Playfair Display', 'IBM Plex Sans', 'IBM Plex Mono']
      }
    });
  }
} 