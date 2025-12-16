import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const setToken = useAuthStore(state => state.setToken);
    const navigate = useNavigate();
    const { toast } = useToast();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Custom validation
        if (!email.trim()) {
            toast({
                variant: 'destructive',
                title: 'Hiányzó mező',
                description: 'Kérlek add meg az email címed.',
            });
            return;
        }
        
        if (!password.trim()) {
            toast({
                variant: 'destructive',
                title: 'Hiányzó mező',
                description: 'Kérlek add meg a jelszavad.',
            });
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const res = await api.post('/auth/login', { email, password });
            useAuthStore.getState().setToken(res.data.token);
            // Navigate with fade animation
            handleNavigation('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
            toast({
                variant: 'destructive',
                title: 'Bejelentkezési hiba',
                description: err.response?.data?.message || 'Login failed. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden">
            <style>{`
                .glass-input::placeholder {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
            `}</style>
            {/* Content */}
            <div 
                className="relative z-10 flex items-center justify-center min-h-screen px-8 py-16"
                style={{
                    opacity: isExiting ? 0 : (isVisible ? 1 : 0),
                    transform: isExiting ? 'translateY(-20px)' : (isVisible ? 'translateY(0)' : 'translateY(20px)'),
                    transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                    pointerEvents: isExiting ? 'none' : 'auto'
                }}
            >
                <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-12">
                    <button
                        onClick={() => handleNavigation('/')}
                        className="inline-block cursor-pointer transition-transform duration-200 hover:scale-105 bg-transparent border-none p-0"
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="relative inline-block w-16 h-16 mb-6">
                            <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: '#FF0040' }}></div>
                            <div className="absolute w-5 h-5 rounded top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: '#FFFFFF' }}></div>
                        </div>
                        <h1 
                            className="text-3xl font-bold mb-2 tracking-tight"
                            style={{ 
                                color: '#FFFFFF',
                                textShadow: '0 2px 20px rgba(0, 0, 0, 0.5), 0 4px 40px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            DEM
                        </h1>
                    </button>
                    <p 
                        className="text-base"
                        style={{ 
                            color: '#F5F5F5',
                            textShadow: '0 1px 10px rgba(0, 0, 0, 0.4)'
                        }}
                    >
                        Bejelentkezés
                    </p>
                </div>

                {/* Login Form */}
                <div 
                    className="backdrop-blur-md rounded-2xl p-8"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div 
                                className="px-4 py-3 rounded-lg text-sm"
                                style={{
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#FEE2E2',
                                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label 
                                    htmlFor="email" 
                                    className="block text-sm font-medium mb-2"
                                    style={{ 
                                        color: '#FFFFFF',
                                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="email@példa.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="glass-input w-full h-14 px-4 rounded-lg focus:outline-none transition-all duration-200 text-base"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: '#FFFFFF'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 0, 64, 0.8)';
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                    }}
                                />
                            </div>

                            <div>
                                <label 
                                    htmlFor="password" 
                                    className="block text-sm font-medium mb-2"
                                    style={{ 
                                        color: '#FFFFFF',
                                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    Jelszó
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-14 px-4 pr-12 rounded-lg focus:outline-none transition-all duration-200 text-base"
                                        style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            color: '#FFFFFF'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(255, 0, 64, 0.8)';
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors"
                                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-lg font-semibold focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
                            style={{
                                backgroundColor: '#FF0040',
                                color: '#FFFFFF',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                boxShadow: '0 4px 15px rgba(255, 0, 64, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.backgroundColor = '#E6003A';
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FF0040';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                    Bejelentkezés...
                                </div>
                            ) : (
                                'Bejelentkezés'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p 
                            className="text-base"
                            style={{ 
                                color: '#F5F5F5',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            Nincs még fiókod?{' '}
                            <button
                                onClick={() => handleNavigation('/register')}
                                className="font-semibold hover:underline transition-all bg-transparent border-none p-0"
                                style={{ color: '#FFFFFF', cursor: 'pointer' }}
                            >
                                Regisztrálj
                            </button>
                        </p>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}