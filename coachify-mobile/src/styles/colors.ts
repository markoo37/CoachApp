// Converted from web app CSS custom properties (HSL to Hex)

export const lightColors = {
  // Main colors
  background: '#ffffff',        // 0 0% 100%
  foreground: '#020817',        // 222.2 84% 4.9%
  card: '#ffffff',              // 0 0% 100%
  cardForeground: '#020817',    // 222.2 84% 4.9%
  popover: '#ffffff',           // 0 0% 100%
  popoverForeground: '#020817', // 222.2 84% 4.9%
  
  // Primary colors
  primary: '#e40145',           // Custom brand color
  primaryForeground: '#ffffff',
  
  // Secondary colors
  secondary: '#f1f5f9',         // 210 40% 96.1%
  secondaryForeground: '#1e293b', // 222.2 47.4% 11.2%
  
  // Muted colors
  muted: '#f1f5f9',             // 210 40% 96.1%
  mutedForeground: '#64748b',   // 215.4 16.3% 46.9%
  
  // Accent colors
  accent: '#f1f5f9',            // 210 40% 96.1%
  accentForeground: '#1e293b',  // 222.2 47.4% 11.2%
  
  // Destructive colors
  destructive: '#ef4444',       // 0 84.2% 60.2%
  destructiveForeground: '#f8fafc', // 210 40% 98%
  
  // Border and input
  border: '#e2e8f0',            // 214.3 31.8% 91.4%
  input: '#e2e8f0',             // 214.3 31.8% 91.4%
  ring: '#e40145',              // Custom brand color
  
  // Chart colors (optional extras)
  chart1: '#3b82f6',
  chart2: '#10b981',
  chart3: '#f59e0b',
  chart4: '#ef4444',
  chart5: '#8b5cf6',
};

export const darkColors = {
  // Main colors
  background: '#020817',        // 222.2 84% 4.9%
  foreground: '#f8fafc',        // 210 40% 98%
  card: '#020817',              // 222.2 84% 4.9%
  cardForeground: '#f8fafc',    // 210 40% 98%
  popover: '#020817',           // 222.2 84% 4.9%
  popoverForeground: '#f8fafc', // 210 40% 98%
  
  // Primary colors
  primary: '#e40145',           // Custom brand color
  primaryForeground: '#ffffff',
  
  // Secondary colors
  secondary: '#1e293b',         // 217.2 32.6% 17.5%
  secondaryForeground: '#f8fafc', // 210 40% 98%
  
  // Muted colors
  muted: '#1e293b',             // 217.2 32.6% 17.5%
  mutedForeground: '#94a3b8',   // 215 20.2% 65.1%
  
  // Accent colors
  accent: '#1e293b',            // 217.2 32.6% 17.5%
  accentForeground: '#f8fafc',  // 210 40% 98%
  
  // Destructive colors
  destructive: '#7f1d1d',       // 0 62.8% 30.6%
  destructiveForeground: '#f8fafc', // 210 40% 98%
  
  // Border and input
  border: '#1e293b',            // 217.2 32.6% 17.5%
  input: '#1e293b',             // 217.2 32.6% 17.5%
  ring: '#e40145',              // Custom brand color
  
  // Chart colors (optional extras)
  chart1: '#3b82f6',
  chart2: '#10b981',
  chart3: '#f59e0b',
  chart4: '#ef4444',
  chart5: '#8b5cf6',
};

export type ThemeColors = typeof lightColors;
