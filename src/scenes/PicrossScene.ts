import * as Phaser from 'phaser';
import { levels } from '../levels';
import { generateSolvablePattern } from '../levelGenerator';
import { ColorSchemeManager } from '../colorScheme';
import { GameStateManager } from '../gameState';

interface GridConfig {
  width: number;
  height: number;
  solution: boolean[][];
}

interface PicrossConfig {
  width: number;
  height: number;
  difficulty: string;
}

export class PicrossScene extends Phaser.Scene {
  private cellSize: number = 40;
  private grid: Phaser.GameObjects.Rectangle[][] = [];
  private cellStates: number[][] = [];  // 0: unknown, 1: filled, 2: marked wrong
  private solution: boolean[][] = [];
  private marginTop: number = 100;  // Space for column hints
  private marginLeft: number = 100;  // Space for row hints
  private isPointerDown: boolean = false;
  private currentAction: number | null = null;
  private currentLevel: number = 0;
  private readonly TITLE_HEIGHT = 80; // Space for title area
  private colors = ColorSchemeManager.getCurrentScheme();
  private readonly FONTS = {
    title: { 
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '48px',
      color: '#1a1a1a'
    },
    subtitle: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '24px',
      color: '#4a4a4a',
      fontStyle: 'italic'
    },
    hints: {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: '16px',
      color: '#333333'
    },
    button: {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '16px',
      color: '#ffffff'
    },
    level: {  // Add this style for timer and progress text
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '20px',
      color: '#333333'
    }
  };
  private rowHints: Phaser.GameObjects.Text[][] = [];
  private colHints: Phaser.GameObjects.Text[][] = [];
  private config!: PicrossConfig;
  private solutionOverlay: Phaser.GameObjects.Rectangle[][] = [];
  private timerText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PicrossScene' });
  }

  init(config: PicrossConfig) {
    this.config = config;
    this.generateNewPuzzle();
  }

  private generateNewPuzzle() {
    // Use current puzzle index to generate a unique seed for each puzzle
    const puzzleIndex = GameStateManager.state.currentPuzzle;
    
    this.solution = generateSolvablePattern({
      width: this.config.width,
      height: this.config.height,
      difficulty: this.config.difficulty as 'easy' | 'medium' | 'hard',
      fillPercentage: this.getDifficultyPercentage(),
      puzzleIndex // Add this parameter
    });

    this.cellStates = Array(this.config.height)
      .fill(0)
      .map(() => Array(this.config.width).fill(0));
  }

  private getDifficultyPercentage(): number {
    switch(this.config.difficulty) {
      case 'easy': return 0.4;
      case 'medium': return 0.5;
      case 'hard': return 0.6;
      default: return 0.45;
    }
  }

  create() {
    // Add paper texture background
    this.add.rectangle(0, 0, 800, 600, this.colors.background)
      .setOrigin(0, 0)
      .setDepth(-1);

    // Calculate grid dimensions
    const gridWidth = this.solution[0].length * this.cellSize;
    const gridHeight = this.solution.length * this.cellSize;
    
    // Calculate margins to center the grid vertically in remaining space
    this.marginLeft = (800 - gridWidth) / 2;
    this.marginTop = ((600 - this.TITLE_HEIGHT - gridHeight) / 2) + this.TITLE_HEIGHT;

    // Add newspaper-style title at the top
    this.add.text(this.cameras.main.centerX, 30, 'Daily Picross', {
      ...this.FONTS.title,
      color: '#000000'
    }).setOrigin(0.5);

    // Add progress counter under title
    this.progressText = this.add.text(this.cameras.main.centerX, 60, 
      `Puzzle ${GameStateManager.state.currentPuzzle + 1} of ${GameStateManager.state.totalPuzzles}`, {
      ...this.FONTS.level,
      color: '#333333'
    }).setOrigin(0.5);

    // Replace jagged button with regular rectangle
    const backButton = this.add.rectangle(80, 30, 120, 30, 0x222222).setInteractive();
    const backText = this.add.text(80, 30, 'Back to Menu', {
      ...this.FONTS.button,
      color: '#ffffff'
    }).setOrigin(0.5);

    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.createGrid();
    this.createHints();

    // Replace jagged button with regular rectangle
    const showSolutionButton = this.add.rectangle(700, 30, 120, 30, this.colors.grid).setInteractive();
    const buttonText = this.add.text(700, 30, 'Show Solution', {
      ...this.FONTS.button,
      color: '#ffffff'
    }).setOrigin(0.5);

    // Create invisible solution overlay
    this.createSolutionOverlay();

    // Show solution while button is held
    showSolutionButton.on('pointerdown', () => this.showSolution(true));
    showSolutionButton.on('pointerup', () => this.showSolution(false));
    showSolutionButton.on('pointerout', () => this.showSolution(false));

    // Add timer next to show solution button
    this.timerText = this.add.text(580, 30, GameStateManager.getElapsedTime(), {
      ...this.FONTS.level,
      color: '#333333'
    }).setOrigin(0.5);

    // Update timer every second
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  private createGrid() {
    const startX = this.marginLeft;
    const startY = this.marginTop;

    // Draw imperfect grid lines first
    const graphics = this.add.graphics();
    graphics.lineStyle(1, this.colors.grid);

    // Vertical lines with slight waviness
    for (let col = 0; col <= this.solution[0].length; col++) {
      const x = startX + (col * this.cellSize);
      graphics.beginPath();
      graphics.moveTo(x, startY);
      
      // Create wavy line by adding small random offsets
      for (let y = startY; y <= startY + (this.solution.length * this.cellSize); y += 5) {
        const wobble = Math.random() * 2 - 1; // Random offset between -1 and 1
        graphics.lineTo(x + wobble, y);
      }
      graphics.stroke();
    }

    // Horizontal lines with slight waviness
    for (let row = 0; row <= this.solution.length; row++) {
      const y = startY + (row * this.cellSize);
      graphics.beginPath();
      graphics.moveTo(startX, y);
      
      // Create wavy line by adding small random offsets
      for (let x = startX; x <= startX + (this.solution[0].length * this.cellSize); x += 5) {
        const wobble = Math.random() * 2 - 1; // Random offset between -1 and 1
        graphics.lineTo(x, y + wobble);
      }
      graphics.stroke();
    }

    // Create cells
    for (let row = 0; row < this.solution.length; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.solution[0].length; col++) {
        const cell = this.add.rectangle(
          startX + col * this.cellSize,
          startY + row * this.cellSize,
          this.cellSize - 2,
          this.cellSize - 2,
          this.colors.cell.default
        );
        cell.setOrigin(0, 0);
        cell.setInteractive();
        
        cell.setData('row', row);
        cell.setData('col', col);
        
        cell.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.isPointerDown = true;
          const currentState = this.cellStates[row][col];
          let nextState: number;

          if (pointer.event.shiftKey) {
            // Shift + Click: Toggle between neutral and marked
            nextState = currentState === 2 ? 0 : 2;
          } else {
            // Normal Click: Toggle between neutral and filled
            nextState = currentState === 1 ? 0 : 1;
          }

          this.currentAction = nextState;
          this.updateCellState(row, col, nextState);
        });

        cell.on('pointerover', () => {
          if (this.isPointerDown && this.currentAction !== null) {
            // Continue the same action while dragging
            this.updateCellState(row, col, this.currentAction);
          } else if (this.cellStates[row][col] === 0) {
            cell.setFillStyle(this.colors.cell.hover);
          }
        });

        cell.on('pointerout', () => {
          if (this.cellStates[row][col] === 0) {
            cell.setFillStyle(this.colors.cell.default);
          }
        });

        this.grid[row][col] = cell;
      }
    }

    // Add pointer up listener to the scene
    this.input.on('pointerup', () => {
      this.isPointerDown = false;
      this.currentAction = null;
      this.checkWinCondition();
    });
  }

  private updateCellState(row: number, col: number, state: number) {
    const previousState = this.cellStates[row][col];
    
    this.cellStates[row][col] = state;
    const cell = this.grid[row][col];
    
    // Remove any existing fill
    if (cell.getData('fillShape')) {
      cell.getData('fillShape').destroy();
    }

    if (state !== 0) { // If not neutral state, create irregular fill
      const x = cell.x;
      const y = cell.y;
      const size = this.cellSize - 2;
      
      // Create slightly irregular points for a hand-drawn look
      const points = [
        { x: x + (Math.random() * 2 - 1), y: y + (Math.random() * 2 - 1) },
        { x: x + size + (Math.random() * 2 - 1), y: y + (Math.random() * 2 - 1) },
        { x: x + size + (Math.random() * 2 - 1), y: y + size + (Math.random() * 2 - 1) },
        { x: x + (Math.random() * 2 - 1), y: y + size + (Math.random() * 2 - 1) }
      ];

      const polygonPoints = points.reduce((arr: number[], point) => {
        arr.push(point.x, point.y);
        return arr;
      }, []);

      const fillShape = this.add.polygon(0, 0, polygonPoints, 
        state === 1 ? this.colors.cell.filled : this.colors.cell.marked
      );
      fillShape.setOrigin(0, 0);
      
      // Store reference to the fill shape
      cell.setData('fillShape', fillShape);
    }

    // Check all affected rows and columns whenever state changes
    if (previousState !== state) {
      this.checkLineCompletion(row, 'row');
      this.checkLineCompletion(col, 'column');
      
      // Also check any connected filled groups
      for (let r = 0; r < this.solution.length; r++) {
        if (r !== row) this.checkLineCompletion(r, 'row');
      }
      for (let c = 0; c < this.solution[0].length; c++) {
        if (c !== col) this.checkLineCompletion(c, 'column');
      }
    }
  }

  private createHints() {
    const hintStyle = {
      ...this.FONTS.hints,
      color: '#333333'
    };

    // Column hints
    for (let col = 0; col < this.solution[0].length; col++) {
      this.colHints[col] = [];
      const hints = this.getColumnHints(col).reverse();
      hints.forEach((hint, index) => {
        const hintText = this.add.text(
          this.marginLeft + col * this.cellSize + this.cellSize/2,
          this.marginTop - 20 - (index * 20),
          hint.toString(),
          hintStyle
        ).setOrigin(0.5);
        this.colHints[col].push(hintText);
      });
    }

    // Row hints
    for (let row = 0; row < this.solution.length; row++) {
      this.rowHints[row] = [];
      const hints = this.getRowHints(row);
      hints.forEach((hint, index) => {
        const hintText = this.add.text(
          this.marginLeft - 20 - ((hints.length - 1 - index) * 20),
          this.marginTop + row * this.cellSize + this.cellSize/2,
          hint.toString(),
          hintStyle
        ).setOrigin(1, 0.5);
        this.rowHints[row].push(hintText);
      });
    }
  }

  private getRowHints(row: number): number[] {
    return this.getHints(this.solution[row]);
  }

  private getColumnHints(col: number): number[] {
    return this.getHints(this.solution.map(row => row[col]));
  }

  private getHints(line: boolean[]): number[] {
    const hints: number[] = [];
    let count = 0;
    
    for (let i = 0; i < line.length; i++) {
      if (line[i]) {
        count++;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
    if (count > 0) {
      hints.push(count);
    }
    return hints.length ? hints : [0];
  }

  private checkWinCondition() {
    // Check if all rows and columns match their hints
    for (let row = 0; row < this.solution.length; row++) {
      const rowGroups = this.getCurrentGroups(this.cellStates[row]);
      const rowHints = this.getRowHints(row);
      if (!this.arraysEqual(rowGroups, rowHints)) {
        return;
      }
    }

    for (let col = 0; col < this.solution[0].length; col++) {
      const colGroups = this.getCurrentGroups(this.cellStates.map(row => row[col]));
      const colHints = this.getColumnHints(col);
      if (!this.arraysEqual(colGroups, colHints)) {
        return;
      }
    }

    // If we get here, all rows and columns match their hints
    this.showWinModal();
  }

  private showWinModal() {
    const modalGroup = this.add.group();
    
    // Replace jagged modal with regular rectangle
    const modal = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      400,
      250,
      this.colors.background,
      0.95
    );
    modal.setStrokeStyle(2, this.colors.grid);
    modalGroup.add(modal);

    // Mark current puzzle as complete
    GameStateManager.markPuzzleComplete(GameStateManager.state.currentPuzzle);

    const isAllComplete = GameStateManager.state.isComplete;
    const title = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 40,
      isAllComplete ? 'ALL PUZZLES COMPLETE!' : 'PUZZLE COMPLETE!',
      {
        ...this.FONTS.title,
        color: '#000000'
      }
    ).setOrigin(0.5);
    modalGroup.add(title);

    const message = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 20,
      isAllComplete ? 
        `Final Time: ${GameStateManager.getElapsedTime()}\nPress ESC for menu` :
        'Click for next puzzle\nPress ESC for menu',
      {
        ...this.FONTS.hints,
        color: '#333333',
        align: 'center'
      }
    ).setOrigin(0.5);
    modalGroup.add(message);

    modal.setInteractive();
    modal.on('pointerdown', () => {
      if (isAllComplete) {
        this.scene.start('MenuScene');
      } else {
        GameStateManager.state.currentPuzzle++;
        this.scene.restart();
      }
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  private checkLineCompletion(index: number, type: 'row' | 'column') {
    const line = type === 'row' 
      ? this.cellStates[index]
      : this.cellStates.map(row => row[index]);
    
    const solution = type === 'row'
      ? this.solution[index]
      : this.solution.map(row => row[index]);

    const hints = type === 'row'
      ? this.getRowHints(index)
      : this.getColumnHints(index);
    
    const hintTexts = type === 'row'
      ? this.rowHints[index]
      : this.colHints[index];

    // Count filled cells
    const currentGroups = this.getCurrentGroups(line);
    
    // Check if the line is complete and correct
    const isComplete = this.arraysEqual(currentGroups, hints);
    const hasError = this.hasLineError(currentGroups, hints);

    // Update hint appearance
    hintTexts.forEach(text => {
      if (isComplete) {
        text.setAlpha(0.3); // Fade out completed hints
      } else if (hasError) {
        text.setColor('#ff0000'); // Make hints red if there's an error
      } else {
        text.setAlpha(1);
        text.setColor('#333333');
      }
    });
  }

  private getCurrentGroups(line: number[]): number[] {
    const groups: number[] = [];
    let count = 0;
    
    for (let i = 0; i < line.length; i++) {
      if (line[i] === 1) { // Only count filled cells
        count++;
      } else if (count > 0) {
        groups.push(count);
        count = 0;
      }
    }
    if (count > 0) {
      groups.push(count);
    }
    return groups;
  }

  private hasLineError(currentGroups: number[], targetHints: number[]): boolean {
    // If there are no groups yet, it's not an error
    if (currentGroups.length === 0) return false;

    // If we have more groups than hints, it's an error
    if (currentGroups.length > targetHints.length) return true;

    // Check each group we have so far
    for (let i = 0; i < currentGroups.length; i++) {
      // If this group is bigger than the corresponding hint, it's an error
      if (currentGroups[i] > targetHints[i]) return true;
      
      // If this is the last group and it's still growing (no gap after it),
      // don't mark as error until it exceeds the hint
      if (i === currentGroups.length - 1) return false;
      
      // If any completed group doesn't match its hint exactly, it's an error
      if (currentGroups[i] !== targetHints[i]) return true;
    }

    return false;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  private createSolutionOverlay() {
    const startX = this.marginLeft;
    const startY = this.marginTop;

    for (let row = 0; row < this.solution.length; row++) {
      this.solutionOverlay[row] = [];
      for (let col = 0; col < this.solution[0].length; col++) {
        const overlay = this.add.rectangle(
          startX + col * this.cellSize,
          startY + row * this.cellSize,
          this.cellSize - 2,
          this.cellSize - 2,
          this.solution[row][col] ? 0x666666 : 0xdddddd,
          0.8
        );
        overlay.setOrigin(0, 0);
        overlay.setVisible(false);
        this.solutionOverlay[row][col] = overlay;
      }
    }
  }

  private showSolution(show: boolean) {
    if (show) {
      GameStateManager.state.usedSolutionHint = true;
    }
    
    for (let row = 0; row < this.solution.length; row++) {
      for (let col = 0; col < this.solution[0].length; col++) {
        this.solutionOverlay[row][col].setVisible(show);
      }
    }
  }

  private updateTimer() {
    if (!GameStateManager.state.isComplete) {
      this.timerText.setText(GameStateManager.getElapsedTime());
    }
  }
} 