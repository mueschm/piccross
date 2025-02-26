interface Pattern {
  width: number;
  height: number;
  difficulty: 'easy' | 'medium' | 'hard';
  fillPercentage: number;
  puzzleIndex: number;
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Simple seeded random number generator
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

function getDailySeed(width: number, height: number, difficulty: string, puzzleIndex: number): number {
  const date = new Date();
  const dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
  const configString = `${width}x${height}-${difficulty}-${puzzleIndex}`;
  
  // Create a numeric hash of the date and config
  let hash = 0;
  const str = dateString + configString;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function generateSolvablePattern(pattern: Pattern): boolean[][] {
  const random = new SeededRandom(
    getDailySeed(
      pattern.width, 
      pattern.height, 
      pattern.difficulty,
      pattern.puzzleIndex
    )
  );
  const grid: boolean[][] = Array(pattern.height).fill(0)
    .map(() => Array(pattern.width).fill(false));
  
  const totalCells = pattern.width * pattern.height;
  const targetFilled = Math.floor(totalCells * pattern.fillPercentage);
  let filledCount = 0;

  // Use seeded random for all random choices
  while (filledCount < targetFilled) {
    const row = Math.floor(random.next() * pattern.height);
    const col = Math.floor(random.next() * pattern.width);
    
    if (!grid[row][col]) {
      grid[row][col] = true;
      filledCount++;
    }
  }

  // Ensure at least one cell in each row and column using seeded random
  for (let row = 0; row < pattern.height; row++) {
    if (!grid[row].some(cell => cell)) {
      const col = Math.floor(random.next() * pattern.width);
      grid[row][col] = true;
    }
  }

  for (let col = 0; col < pattern.width; col++) {
    if (!grid.some(row => row[col])) {
      const row = Math.floor(random.next() * pattern.height);
      grid[row][col] = true;
    }
  }

  return grid;
}

// Shape generators
function createLine(grid: boolean[][], pattern: Pattern): boolean[][] {
  const newGrid = grid.map(row => [...row]);
  const isHorizontal = Math.random() < 0.5;
  const length = Math.floor(Math.random() * 3) + 2; // 2-4 cells
  
  if (isHorizontal) {
    const row = Math.floor(Math.random() * pattern.height);
    const startCol = Math.floor(Math.random() * (pattern.width - length + 1));
    for (let i = 0; i < length; i++) {
      newGrid[row][startCol + i] = true;
    }
  } else {
    const col = Math.floor(Math.random() * pattern.width);
    const startRow = Math.floor(Math.random() * (pattern.height - length + 1));
    for (let i = 0; i < length; i++) {
      newGrid[startRow + i][col] = true;
    }
  }
  
  return newGrid;
}

function createBox(grid: boolean[][], pattern: Pattern): boolean[][] {
  const newGrid = grid.map(row => [...row]);
  const size = Math.min(
    2,
    Math.floor(Math.random() * Math.min(pattern.width, pattern.height) - 1)
  );
  
  const startRow = Math.floor(Math.random() * (pattern.height - size));
  const startCol = Math.floor(Math.random() * (pattern.width - size));
  
  for (let row = startRow; row < startRow + size; row++) {
    for (let col = startCol; col < startCol + size; col++) {
      newGrid[row][col] = true;
    }
  }
  
  return newGrid;
}

function createDiagonal(grid: boolean[][], pattern: Pattern): boolean[][] {
  const newGrid = grid.map(row => [...row]);
  const length = Math.floor(Math.random() * 3) + 2; // 2-4 cells
  const isRightDiagonal = Math.random() < 0.5;
  
  const startRow = Math.floor(Math.random() * (pattern.height - length + 1));
  const startCol = isRightDiagonal 
    ? Math.floor(Math.random() * (pattern.width - length + 1))
    : Math.floor(Math.random() * (pattern.width - length + 1)) + length - 1;
  
  for (let i = 0; i < length; i++) {
    newGrid[startRow + i][isRightDiagonal ? startCol + i : startCol - i] = true;
  }
  
  return newGrid;
}

function createCorner(grid: boolean[][], pattern: Pattern): boolean[][] {
  const newGrid = grid.map(row => [...row]);
  const size = 2;
  
  // Pick a corner
  const topCorner = Math.random() < 0.5;
  const leftCorner = Math.random() < 0.5;
  
  const startRow = topCorner ? 0 : pattern.height - size;
  const startCol = leftCorner ? 0 : pattern.width - size;
  
  newGrid[startRow][startCol] = true;
  newGrid[startRow + (topCorner ? 1 : -1)][startCol] = true;
  newGrid[startRow][startCol + (leftCorner ? 1 : -1)] = true;
  
  return newGrid;
}

// Generate levels with increasing difficulty
export function generateLevels(): { solution: boolean[][] }[] {
  const levels: { solution: boolean[][] }[] = [];

  // 10 4x4 levels (easy)
  for (let i = 0; i < 10; i++) {
    levels.push({
      solution: generateSolvablePattern({
        width: 4,
        height: 4,
        difficulty: 'easy',
        fillPercentage: 0.4 + (i * 0.02),
        puzzleIndex: i
      })
    });
  }

  // 30 5x5 levels (easy-medium)
  for (let i = 0; i < 30; i++) {
    levels.push({
      solution: generateSolvablePattern({
        width: 5,
        height: 5,
        difficulty: 'easy',
        fillPercentage: 0.45 + (i * 0.01), // 45-74% filled
        puzzleIndex: i
      })
    });
  }

  // 30 6x6 levels (medium)
  for (let i = 0; i < 30; i++) {
    levels.push({
      solution: generateSolvablePattern({
        width: 6,
        height: 6,
        difficulty: 'medium',
        fillPercentage: 0.5 + (i * 0.01), // 50-79% filled
        puzzleIndex: i
      })
    });
  }

  // 30 7x7 levels (hard)
  for (let i = 0; i < 30; i++) {
    levels.push({
      solution: generateSolvablePattern({
        width: 7,
        height: 7,
        difficulty: 'hard',
        fillPercentage: 0.55 + (i * 0.01), // 55-84% filled
        puzzleIndex: i
      })
    });
  }

  return levels;
} 