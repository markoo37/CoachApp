import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const navigate = useNavigate();

    // Password strength validation
    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const passwordStrength = getPasswordStrength(password);
    const passwordStrengthText = ['Nagyon gyenge', 'Gyenge', 'Elfogadható', 'Jó', 'Erős'][passwordStrength];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setError('Kérlek fogadd el a felhasználási feltételeket');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            await api.post('/auth/register', 
                { email, password, firstName, lastName }, 
                { headers: { 'Content-Type': 'application/json' } }
            );
            
            // Show success message and redirect
            navigate('/login', { state: { message: 'Sikeres regisztráció! Most már bejelentkezhetsz.' } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Regisztráció sikertelen. Próbáld újra!');
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
                        <div className="absolute w-4 h-4 bg-primary-foreground rounded top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                        Fiók létrehozása
                    </h1>
                    <p className="text-muted-foreground text-base">
                        Csatlakozz a Coachify közösségéhez
                    </p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-popover-foreground mb-2">
                                Keresztnév
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                placeholder="János"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="w-full h-14 px-4 border border-input rounded-lg focus:outline-none focus:border-primary transition-colors text-base text-foreground placeholder-muted-foreground bg-background"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-popover-foreground mb-2">
                                Vezetéknév
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                placeholder="Kovács"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="w-full h-14 px-4 border border-input rounded-lg focus:outline-none focus:border-primary transition-colors text-base text-foreground placeholder-muted-foreground bg-background"
                                required
                            />
                        </div>
                    </div>

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
                                placeholder="Minimum 6 karakter"
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
                        
                        {password && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span>Jelszó erőssége</span>
                                    <span className="font-medium">{passwordStrengthText}</span>
                                </div>
                                <div className="flex space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${
                                                i < passwordStrength ? 'bg-primary' : 'bg-muted'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    A jelszónak legalább 6 karakter hosszúnak kell lennie
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={e => setAgreedToTerms(e.target.checked)}
                                className="w-4 h-4 text-primary bg-background border-2 border-input rounded focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="text-muted-foreground">
                                Elfogadom a{' '}
                                <Link to="/terms" className="text-foreground font-semibold hover:underline">
                                    Felhasználási Feltételeket
                                </Link>{' '}
                                és az{' '}
                                <Link to="/privacy" className="text-foreground font-semibold hover:underline">
                                    Adatvédelmi Szabályzatot
                                </Link>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !agreedToTerms}
                        className="w-full h-14 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                                Regisztráció...
                            </div>
                        ) : (
                            'Fiók létrehozása'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-muted-foreground text-base">
                        Van már fiókod?{' '}
                        <Link to="/login" className="text-foreground font-semibold hover:underline">
                            Bejelentkezés
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}