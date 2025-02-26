import * as Phaser from 'phaser';
import { GameStateManager } from '../gameState';

export class MenuScene extends Phaser.Scene {
  private readonly COLORS = {
    background: 0xf4f1ea,
    paper: 0xffffff,
    grid: 0x666666,
    text: {
      primary: '#000000',
      secondary: '#666666'
    }
  };

  private readonly FONTS = {
    title: { fontFamily: 'Georgia, serif', fontSize: '64px', color: '#000000' },
    subtitle: { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#666666', fontStyle: 'italic' },
    heading: { fontFamily: 'Georgia, serif', fontSize: '32px', color: '#000000' },
    body: { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#333333' },
    button: { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#ffffff' }
  };

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Reset game state when entering menu
    GameStateManager.startNewGame();

    const centerX = this.cameras.main.centerX;

    // Background texture
    this.add.rectangle(0, 0, 800, 600, this.COLORS.background).setOrigin(0, 0);
    
    // Decorative line at top
    this.add.rectangle(0, 40, 800, 2, this.COLORS.grid).setOrigin(0, 0);
    
    // Newspaper header
    this.add.text(centerX, 80, 'THE DAILY', {
      ...this.FONTS.subtitle,
      fontSize: '32px'
    }).setOrigin(0.5);

    this.add.text(centerX, 140, 'PICROSS', {
      ...this.FONTS.title
    }).setOrigin(0.5);

    this.add.text(centerX, 190, 'Est. 2024', {
      ...this.FONTS.subtitle
    }).setOrigin(0.5);

    // Decorative lines
    this.add.rectangle(0, 220, 800, 2, this.COLORS.grid).setOrigin(0, 0);
    this.add.rectangle(0, 225, 800, 1, this.COLORS.grid).setOrigin(0, 0);

    // Grid size section
    this.createNewspaperSection(
      centerX,
      280,
      'PUZZLE DIMENSIONS',
      'Select your grid size:'
    );

    // Size selector
    const sizeBox = this.add.rectangle(centerX, 380, 200, 60, this.COLORS.paper);
    sizeBox.setStrokeStyle(2, this.COLORS.grid);

    const widthInput = this.add.text(centerX - 50, 380, '5', {
      ...this.FONTS.body,
      backgroundColor: '#ffffff',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();

    this.add.text(centerX, 380, '×', {
      ...this.FONTS.body
    }).setOrigin(0.5);

    const heightInput = this.add.text(centerX + 50, 380, '5', {
      ...this.FONTS.body,
      backgroundColor: '#ffffff',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();

    // Difficulty section
    this.createNewspaperSection(
      centerX,
      440,
      'DIFFICULTY',
      'Choose your challenge:'
    );

    const difficulties = ['Easy', 'Medium', 'Hard'];
    let currentDifficulty = 0;

    const difficultyText = this.add.text(centerX, 520, difficulties[currentDifficulty], {
      ...this.FONTS.body,
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive();
    
    const diffBox = this.add.rectangle(
      centerX,
      520,
      difficultyText.width + 50,
      difficultyText.height + 10,
      this.COLORS.paper
    );
    diffBox.setStrokeStyle(2, this.COLORS.grid);
    diffBox.setDepth(-1);

    // Start button
    const startButton = this.add.rectangle(centerX, 580, 250, 50, 0x000000);
    const startText = this.add.text(centerX, 580, 'Begin Puzzle', {
      ...this.FONTS.button
    }).setOrigin(0.5);

    // Interactions
    [widthInput, heightInput].forEach(input => {
      input.on('pointerdown', () => {
        const current = parseInt(input.text);
        const next = current < 10 ? current + 1 : 4;
        input.setText(next.toString());
      });
    });

    difficultyText.on('pointerdown', () => {
      currentDifficulty = (currentDifficulty + 1) % difficulties.length;
      difficultyText.setText(difficulties[currentDifficulty]);
      diffBox.width = difficultyText.width + 50;
    });

    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      this.scene.start('PicrossScene', {
        width: parseInt(widthInput.text),
        height: parseInt(heightInput.text),
        difficulty: difficulties[currentDifficulty].toLowerCase()
      });
    });
  }

  private createNewspaperSection(x: number, y: number, title: string, subtitle: string) {
    this.add.text(x, y, title, {
      ...this.FONTS.heading
    }).setOrigin(0.5);

    this.add.text(x, y + 40, subtitle, {
      ...this.FONTS.body
    }).setOrigin(0.5);
  }
} 