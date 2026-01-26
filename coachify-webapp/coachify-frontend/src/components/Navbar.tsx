import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSidebar } from '../contexts/SidebarContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
import gruadLogoLight from '../assets/gruad_notext.png';
import gruadLogoDark from '../assets/gruad_notext.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSidebarExpanded, setIsSidebarExpanded } = useSidebar();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const location = useLocation();
  const { token } = useAuthStore();

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

    return () => {
      observer.disconnect();
    };
  }, []);


  const navigation = [
    { name: 'Főoldal',      href: '/dashboard',      icon: HomeIcon,       current: location.pathname === '/dashboard' },
    { name: 'Csapataim',     href: '/my-teams',      icon: UserGroupIcon,  current: location.pathname === '/my-teams' },
    { name: 'Sportolók',     href: '/athletes',      icon: UserCircleIcon, current: location.pathname === '/athletes' },
    { name: 'Edzéstervek',   href: '/training-plans', icon: CalendarIcon,   current: location.pathname === '/training-plans' },
    { name: 'Naptár',        href: '/calendar',      icon: CalendarIcon,   current: location.pathname === '/calendar' },
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
                      relative flex items-center px-3 py-2 rounded-lg text-base font-normal
                      transition-colors overflow-hidden antialiased
                      ${item.current
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-primary-foreground'
                      }
                    `}
                  >
                    {/* Background */}
                    <div
                      className={`
                        absolute inset-0 bg-primary rounded-lg
                        ${item.current
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-full opacity-0'
                        }
                      `}
                    />
                    <Icon className="relative z-10 h-5 w-5 mr-3" />
                    <span className="relative z-10 antialiased">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar - Neumorphic Design */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-muted border-r border-border transition-[width] duration-300 ease-in-out ${
        isSidebarExpanded ? 'lg:w-64' : 'lg:w-20'
      }`}>
        {/* Top Hamburger Menu Button - Circular */}
        <div className="flex-shrink-0 p-4 flex items-center justify-center">
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center transition-all duration-200 active:scale-95 hover:bg-muted/80"
          >
            <Bars3Icon className={`h-6 w-6 transition-transform duration-300 flex-shrink-0 ${isSidebarExpanded ? 'rotate-90' : ''} text-muted-foreground`} />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-shrink-0 h-8" />

        {/* Navigation - Rounded Rectangular Buttons */}
        <div className="flex-1 px-3 py-4 space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="relative flex items-center group w-full h-14"
              >
                {/* Icon Container - Absolutely positioned to prevent movement */}
                <div 
                  className={`absolute flex-shrink-0 w-14 h-14 flex items-center justify-center transition-all duration-300 ease-in-out ${
                    isSidebarExpanded ? 'left-3' : 'left-1/2 -translate-x-1/2'
                  }`}
                >
                  {item.current ? (
                    <div
                      className="relative w-14 h-14 rounded-lg flex items-center justify-center bg-foreground/10"
                    >
                      <Icon 
                        className="h-6 w-6 text-primary flex-shrink-0" 
                      />
                      
                      {/* Active Indicator - Horizontal line beneath icon (only when collapsed) */}
                      {!isSidebarExpanded && (
                        <div 
                          key={location.pathname}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full animate-expand"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <Icon 
                        className="h-6 w-6 text-muted-foreground flex-shrink-0" 
                      />
                    </div>
                  )}
                </div>
                
                {/* Tab Name - Only visible when expanded, slides in from left */}
                <span 
                  className={`
                    text-sm font-normal whitespace-nowrap overflow-hidden
                    transition-all duration-300 ease-in-out
                    ${item.current 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                    }
                    ${isSidebarExpanded 
                      ? 'opacity-100 max-w-full ml-[5rem]' 
                      : 'opacity-0 max-w-0 ml-0'
                    }
                  `}
                >
                  {item.name}
                </span>
                
                {/* Active Indicator - Vertical bar on right edge (only when expanded) */}
                {item.current && isSidebarExpanded && (
                  <div 
                    key={`${location.pathname}-vertical`}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full animate-expand-vertical"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-shrink-0 h-8" />

        {/* Bottom Theme Toggle Button - Circular */}
        <div className="flex-shrink-0 p-4 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center transition-all duration-200 hover:bg-muted/80">
            <div className="flex items-center justify-center w-full h-full [&>button]:h-6 [&>button]:w-6 [&>button]:bg-transparent [&>button]:hover:bg-transparent [&>button]:shadow-none [&>button]:p-0 [&>button]:m-0 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:relative">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}