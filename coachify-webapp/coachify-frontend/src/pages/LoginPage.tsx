import React, { useState } from 'react';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const setToken = useAuthStore(state => state.setToken);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const res = await api.post('/auth/login', { email, password });
            useAuthStore.getState().setToken(res.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-8 py-16">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="relative inline-block w-16 h-16 mb-6">
                        <div className="absolute inset-0 bg-primary rounded-lg"></div>
                        <div className="absolute w-5 h-5 bg-primary-foreground rounded top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                        Coachify
                    </h1>
                    <p className="text-muted-foreground text-base">
                        Bejelentkezés
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-popover-foreground mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="email@példa.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full h-14 px-4 border border-input rounded-lg focus:outline-none focus:border-primary transition-colors text-base text-foreground placeholder-muted-foreground bg-background"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-popover-foreground mb-2">
                                Jelszó
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full h-14 px-4 pr-12 border border-input rounded-lg focus:outline-none focus:border-primary transition-colors text-base text-foreground placeholder-muted-foreground bg-background"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                        className="w-full h-14 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                                Bejelentkezés...
                            </div>
                        ) : (
                            'Bejelentkezés'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-muted-foreground text-base">
                        Nincs még fiókod?{' '}
                        <Link to="/register" className="text-foreground font-semibold hover:underline">
                            Regisztrálj
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}