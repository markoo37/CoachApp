import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
import gruadLogoLight from '../assets/gruad_notext.png';
import gruadLogoDark from '../assets/gruad_notext.png';
import api from '../api/api';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const location = useLocation();
  const navigate = useNavigate();
  const { token, email, firstName, lastName, logout } = useAuthStore();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check theme on component mount and when it changes
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    // Initial check
    handleThemeChange();

    // Create observer to watch for class changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Click outside handler for profile dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout'); // ⬅ backend: refreshToken revoke + cookie törlés
    } catch (error) {
      console.error('Logout error:', error);
      // ha a backend valamiért elszáll, akkor is kiléptetjük frontenden
    } finally {
      logout();               // ⬅ frontend: Zustand store ürítése
      navigate('/');          // vagy '/login', ahova szeretnéd
      setIsProfileOpen(false);
    }
  };  

  const navigation = [
    { name: 'Főoldal',      href: '/dashboard',      icon: HomeIcon,       current: location.pathname === '/dashboard' },
    { name: 'Csapataim',     href: '/my-teams',      icon: UserGroupIcon,  current: location.pathname === '/my-teams' },
    { name: 'Sportolók',     href: '/athletes',      icon: UserCircleIcon, current: location.pathname === '/athletes' },
    { name: 'Edzéstervek',   href: '/training-plans', icon: CalendarIcon,   current: location.pathname === '/training-plans' },
    { name: 'Analitika',     href: '/analytics',     icon: ChartBarIcon,   current: location.pathname === '/analytics' },
    { name: 'Beállítások',   href: '/settings',      icon: CogIcon,        current: location.pathname === '/settings' },
  ];

  const LogoComponent = () => (
    <div className="relative flex items-center justify-center w-8 h-8">
      <img 
        src={theme === 'light' ? gruadLogoLight : gruadLogoDark}
        alt="Gruad Logo" 
        className="w-8 h-8 rounded-lg"
      />
    </div>
  );

  if (!token) {
    // Non-authenticated top navbar
    return (
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <LogoComponent />
              <span className="ml-3 text-xl font-bold text-foreground tracking-tight">DEM</span>
            </Link>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                  Bejelentkezés
              </Link>
              <Link
                to="/register"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-200"
              >
                Regisztráció
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated sidebar
  return (
    <>
      {/* Mobile navbar */}
      <div className="lg:hidden sticky top-0 z-50 bg-background border-b border-border">
        <div className="px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <LogoComponent />
          </Link>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="border-b border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      relative flex items-center px-3 py-2 rounded-lg text-base font-medium
                      transition-colors duration-300 ease-in-out overflow-hidden will-change-[background-color,color]
                      ${item.current
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-primary-foreground'
                      }
                    `}
                  >
                    {/* Smooth background animation */}
                    <div
                      className={`
                        absolute inset-0 bg-primary rounded-lg
                        transition-all duration-300 ease-in-out will-change-transform
                        ${item.current
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-full opacity-0'
                        }
                      `}
                    />
                    <Icon className="relative z-10 h-5 w-5 mr-3 transition-colors duration-300 ease-in-out will-change-colors" />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:bg-background lg:border-r lg:border-border">
        {/* Logo */}
        <div className="flex-shrink-0 h-20 px-6 flex items-center border-b border-border">
          <Link to="/" className="flex items-center">
            <LogoComponent />
            <span className="ml-3 text-xl font-bold text-foreground tracking-tight">DEM</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  relative flex items-center px-4 py-3 rounded-lg text-sm font-medium
                  transition-colors duration-300 ease-in-out will-change-[background-color,color]
                  ${item.current
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }
                `}
              >
                {/* Smooth animated border indicator */}
                <div
                  className={`
                    absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full
                    transition-all duration-300 ease-in-out origin-center will-change-transform
                    ${item.current
                      ? 'opacity-100 scale-y-100'
                      : 'opacity-0 scale-y-0'
                    }
                  `}
                />
                <Icon 
                  className={`
                    h-5 w-5 mr-3 transition-colors duration-300 ease-in-out will-change-colors
                    ${item.current ? 'text-primary' : 'text-muted-foreground'}
                  `} 
                />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Upgrade section - optional, can be removed */}
        <div className="flex-shrink-0 border-t border-border p-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-foreground mb-2">Upgrade to Premium</p>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main content wrapper - adds margin for sidebar */}
      <div className="lg:pl-64">
        {/* This div ensures the content is pushed to the right of the sidebar */}
      </div>
    </>
  );
}