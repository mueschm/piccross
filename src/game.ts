import * as Phaser from 'phaser';
import { PicrossScene } from './scenes/PicrossScene';
import { MenuScene } from './scenes/MenuScene';

export class Game extends Phaser.Game {
  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game',
      backgroundColor: 0xf4f1ea, // aged paper color
      scene: [MenuScene, PicrossScene]
    };
    super(config);
  }
}

window.onload = () => {
  new Game();
}; 