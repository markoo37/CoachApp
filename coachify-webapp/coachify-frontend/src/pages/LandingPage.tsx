import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Silk from '../components/Silk';

export default function LandingPage() {
    return (
        <div className="relative w-full min-h-screen overflow-hidden">
            {/* Silk Background */}
            <div className="fixed inset-0 z-0" style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}>
                <Silk 
                    speed={5}
                    scale={1}
                    color="#662E37"
                    noiseIntensity={1.5}
                    rotation={0}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-4xl">
                    <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight">
                        Üdvözöljük a Coachify-ban
                    </h1>
                    
                    <p className="mb-8 text-xl sm:text-2xl text-muted-foreground leading-relaxed">
                        Emeld a sportolóidat bajnoki szintre a legmodernebb sportmenedzsment eszközeinkkel.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-primary/25"
                        >
                            Ingyenes próba
                            <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center px-8 py-4 bg-background/80 text-foreground font-semibold rounded-full border border-border hover:bg-muted/50 transition-all duration-200 backdrop-blur-sm"
                        >
                            Bejelentkezés
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}