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
              <span className="ml-3 text-xl font-bold text-foreground tracking-tight">Gruad</span>
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
                      flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 relative overflow-hidden
                      ${item.current
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-primary-foreground before:absolute before:inset-x-0 before:bottom-0 before:bg-primary before:h-full before:-translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 before:-z-10'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
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
        <div className="flex-shrink-0 h-16 px-4 flex items-center justify-between border-b border-border">
          <Link to="/" className="flex items-center">
            <LogoComponent />
            <span className="ml-3 text-xl font-bold text-foreground tracking-tight">Gruad</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden
                  ${item.current
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-primary-foreground before:absolute before:inset-x-0 before:bottom-0 before:bg-primary before:h-full before:-translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 before:-z-10'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Profile section */}
        <div className="flex-shrink-0 border-t border-border p-4">
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-full flex items-center text-left space-x-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {firstName?.[0]}{lastName?.[0]}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {firstName} {lastName}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {email}
                </div>
              </div>
            </button>

            <div 
              className={`absolute bottom-full left-0 mb-2 w-full bg-popover rounded-lg shadow-lg border border-border py-1 transform transition-all duration-200 ease-in-out ${
                isProfileOpen 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
            >
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <UserCircleIcon className="h-4 w-4 mr-3" />
                Profil
              </Link>
              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <CogIcon className="h-4 w-4 mr-3" />
                Beállítások
              </Link>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Kijelentkezés
              </button>
            </div>
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