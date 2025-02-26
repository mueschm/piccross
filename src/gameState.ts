export interface GameState {
  currentPuzzle: number;
  totalPuzzles: number;
  startTime: number;
  completedPuzzles: boolean[];
  isComplete: boolean;
  usedSolutionHint: boolean;
}

export const GameStateManager = {
  state: {
    currentPuzzle: 0,
    totalPuzzles: 10,
    startTime: Date.now(),
    completedPuzzles: new Array(10).fill(false),
    isComplete: false,
    usedSolutionHint: false
  } as GameState,

  startNewGame() {
    this.state = {
      currentPuzzle: 0,
      totalPuzzles: 10,
      startTime: Date.now(),
      completedPuzzles: new Array(10).fill(false),
      isComplete: false,
      usedSolutionHint: false
    };
  },

  markPuzzleComplete(index: number) {
    this.state.completedPuzzles[index] = true;
    this.state.isComplete = this.state.completedPuzzles.every(p => p);
  },

  getElapsedTime(): string {
    const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    return this.state.usedSolutionHint ? `${timeStr}*` : timeStr;
  }
}; 