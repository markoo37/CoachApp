import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Betöltéskor ellenőrizzük a tárolt témát
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      // Ha nincs tárolt téma, használjuk a világos témát
      applyTheme('light');
    }
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Eltávolítjuk a meglévő témát
    root.classList.remove('light', 'dark');
    
    // Alkalmazzuk az új témát
    root.classList.add(newTheme);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    handleThemeChange(newTheme);
  };

  const getThemeText = () => {
    return theme === 'dark' ? 'Sötét' : 'Világos';
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9"
        disabled
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Téma váltása</span>
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 relative"
      onClick={toggleTheme}
    >
      <Sun 
        className={`h-4 w-4 absolute transition-all duration-300 ease-in-out ${
          theme === 'dark' 
            ? 'rotate-90 scale-0 opacity-0' 
            : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon 
        className={`h-4 w-4 absolute transition-all duration-300 ease-in-out ${
          theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
      <span className="sr-only">Téma váltása - {getThemeText()}</span>
    </Button>
  );
}