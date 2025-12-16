import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function LandingPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Small delay to allow previous page to fade out first
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleNavigation = (path: string) => {
        setIsExiting(true);
        // Wait for fade-out animation to complete before navigating
        setTimeout(() => {
            navigate(path);
        }, 400); // Match the transition duration
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden">
            {/* Content */}
            <div 
                className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
                style={{
                    opacity: isExiting ? 0 : (isVisible ? 1 : 0),
                    transform: isExiting ? 'translateY(-20px)' : (isVisible ? 'translateY(0)' : 'translateY(20px)'),
                    transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                    pointerEvents: isExiting ? 'none' : 'auto'
                }}
            >
                <div className="text-center max-w-4xl">
                    <h1 
                        className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
                        style={{ 
                            color: '#FFFFFF',
                            textShadow: '0 2px 20px rgba(0, 0, 0, 0.5), 0 4px 40px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        DEM
                    </h1>
                    
                    <p 
                        className="mb-8 text-xl sm:text-2xl leading-relaxed"
                        style={{ 
                            color: '#F5F5F5',
                            textShadow: '0 1px 10px rgba(0, 0, 0, 0.4), 0 2px 20px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        Digitális Edzői Menedzsmentrendszer
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleNavigation('/register')}
                            className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                            style={{
                                backgroundColor: '#FF0040',
                                color: '#FFFFFF',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (!isExiting) {
                                    e.currentTarget.style.backgroundColor = '#E6003A';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FF0040';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Edzői fiók létrehozása
                            <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </button>
                        <button
                            onClick={() => handleNavigation('/login')}
                            className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full transition-all duration-200 backdrop-blur-sm"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                color: '#FFFFFF',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (!isExiting) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Bejelentkezés
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}