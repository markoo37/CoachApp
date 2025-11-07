import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import "@theme-toggles/react/css/Around.css";
import { Around } from "@theme-toggles/react";

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

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

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9"
      onClick={toggleTheme}
    >
      <Around 
        duration={750} 
        toggled={theme === 'dark'}
        className="h-4 w-4"
        {...{} as any}
      />
      <span className="sr-only">Téma váltása - {getThemeText()}</span>
    </Button>
  );
}