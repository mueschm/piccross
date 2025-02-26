export interface ColorScheme {
  background: number;
  paper: number;
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  cell: {
    default: number;
    hover: number;
    filled: number;
    marked: number;
  };
  grid: number;
}

export const colorSchemes = {
  light: {
    background: 0xf4f1ea,
    paper: 0xffffff,
    text: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#ffffff'
    },
    cell: {
      default: 0xffffff,
      hover: 0xf0f0f0,
      filled: 0x222222,
      marked: 0x884444
    },
    grid: 0x666666
  },
  dark: {
    background: 0x1a1a1a,
    paper: 0x2d2d2d,
    text: {
      primary: '#e0e0e0',
      secondary: '#9e9e9e',
      accent: '#ffffff'
    },
    cell: {
      default: 0x2d2d2d,
      hover: 0x3d3d3d,
      filled: 0x90caf9,
      marked: 0xff8a80
    },
    grid: 0x424242
  }
};

let currentScheme: 'light' | 'dark' = 'light';

export const ColorSchemeManager = {
  getCurrentScheme(): ColorScheme {
    return colorSchemes[currentScheme];
  },
  toggleScheme() {
    currentScheme = currentScheme === 'light' ? 'dark' : 'light';
    return this.getCurrentScheme();
  },
  isDarkMode(): boolean {
    return currentScheme === 'dark';
  }
}; 