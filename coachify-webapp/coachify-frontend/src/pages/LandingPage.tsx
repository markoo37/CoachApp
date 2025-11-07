import React, { useEffect, useRef, useMemo, ReactNode, RefObject } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowRightIcon, 
    PlayIcon,
    CheckIcon,
    StarIcon,
    UserGroupIcon,
    ChartBarIcon,
    TrophyIcon,
    SparklesIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  dataAnimate?: boolean;
}

// Simplified ScrollReveal component without animations
const ScrollReveal: React.FC<ScrollRevealProps> = ({
    children,
    containerClassName = "",
    textClassName = ""
}) => {
    return (
        <h1 className={`my-5 ${containerClassName}`}>
            <div className={`${textClassName}`}>
                {children}
            </div>
        </h1>
    );
};

export default function LandingPage() {
    const features = [
        {
            name: 'Sportoló kezelés',
            description: 'Átfogó sportoló profilok teljesítmény követéssel és részletes analitikával.',
            icon: UserGroupIcon,
        },
        {
            name: 'Teljesítmény analitika',
            description: 'Fejlett metrikák és betekintések, hogy segítsünk a sportolóknak elérni a potenciáljukat.',
            icon: ChartBarIcon,
        },
        {
            name: 'Eredmény követés',
            description: 'Figyelje a fejlődést és ünneplje a mérföldköveket az eredménykövetési rendszerrel.',
            icon: TrophyIcon,
        },
        {
            name: 'Okos betekintések',
            description: 'AI-alapú ajánlások és személyre szabott edzési javaslatok.',
            icon: SparklesIcon,
        },
    ];

    const testimonials = [
        {
            name: 'Kovács Péter',
            role: 'Atlétika edző',
            content: 'A Coachify forradalmasította a csapatkezelésem. Az analitikák hihetetlen pontosak!',
            rating: 5,
        },
        {
            name: 'Nagy Eszter',
            role: 'Úszó edző',
            content: 'A teljesítménykövetési funkciók átlagosan 15%-kal javították a sportolók eredményeit.',
            rating: 5,
        },
        {
            name: 'Szabó János',
            role: 'Tenisz edző',
            content: 'A legjobb befektetés, amit az edzői karrierem során tettem. Szívből ajánlom!',
            rating: 5,
        },
    ];

    const pricingPlans = [
        {
            name: 'Kezdő',
            price: '5.990 Ft',
            description: 'Tökéletes egyéni edzőknek',
            features: ['Maximum 10 sportoló', 'Alapvető analitika', 'Email támogatás', 'Mobil alkalmazás'],
            popular: false,
        },
        {
            name: 'Professzionális',
            price: '14.990 Ft',
            description: 'Növekvő csapatoknak',
            features: ['Maximum 50 sportoló', 'Fejlett analitika', 'Prioritásos támogatás', 'Csapat együttműködés', 'Egyedi jelentések'],
            popular: true,
        },
        {
            name: 'Vállalati',
            price: '29.990 Ft',
            description: 'Nagy szervezeteknek',
            features: ['Korlátlan sportolók', 'Prémium analitika', '24/7 támogatás', 'API hozzáférés', 'Egyedi integrációk'],
            popular: false,
        },
    ];

    return (
        <div className="w-full min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative w-full min-h-[70vh] overflow-hidden bg-background">
                {/* Background Gradients and Images */}
                <div className="absolute inset-0 overflow-hidden z-0">
                    {/* Background images for dark/light modes */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-y-0 right-0 w-2/3">
                            <img 
                                src="/src/assets/landingpage/hero_background1.png" 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover dark:opacity-40 opacity-0 transition-opacity duration-300"
                            />
                            <img 
                                src="/src/assets/landingpage/heroimage2.png" 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover dark:opacity-0 opacity-40 transition-opacity duration-300"
                            />
                        </div>
                        {/* Gradient overlays for better text readability and smooth transitions */}
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/98 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20"></div>
                        <div className="absolute inset-0 bg-gradient-to-l from-background/80 via-transparent to-transparent"></div>
                    </div>
                    
                    {/* Additional gradient overlays for depth */}
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-primary/5 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-plus-lighter"></div>
                    <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-secondary/5 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-plus-lighter"></div>
                </div>

                {/* Content Container */}
                <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24">
                    <div className="grid grid-cols-1 gap-12 items-center">
                        {/* Left Column - Text Content */}
                        <div className="relative z-10">
                            <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight text-left">
                            Fókusz. Fejlődés. Gruad.
                            </h1>
                            
                            <p className="mb-8 text-xl sm:text-2xl text-muted-foreground leading-relaxed text-left">
                                Emeld a sportolóidat bajnoki szintre a legmodernebb sportmenedzsment eszközeinkkel.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-primary/25"
                                >
                                    Ingyenes próba
                                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                                </Link>
                                <button className="inline-flex items-center justify-center px-8 py-4 bg-background/80 text-foreground font-semibold rounded-full border border-border hover:bg-muted/50 transition-all duration-200 backdrop-blur-sm">
                                    <PlayIcon className="mr-2 h-5 w-5" />
                                    Demó megtekintése
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <div className="w-full py-12 md:py-20 bg-muted">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 md:mb-16">
                        <ScrollReveal
                            containerClassName="mb-4"
                            textClassName="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground"
                        >
                            Minden, amire szükséged van a sikerhez
                        </ScrollReveal>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Hatékony funkciók, kifejezetten edzőknek és sport szakembereknek tervezve
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.name} className="bg-background border border-border rounded-lg p-6 hover:border-primary/30 transition-all duration-200">
                                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                                        <Icon className="h-6 w-6 text-primary-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.name}</h3>
                                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="w-full py-12 md:py-20">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 md:mb-16">
                        <ScrollReveal
                            containerClassName="mb-4"
                            textClassName="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground"
                        >
                            Edzők szeretik világszerte
                        </ScrollReveal>
                        <p className="text-lg md:text-xl text-muted-foreground">
                            Nézd meg, mit mond rólunk a közösségünk
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-background border border-border rounded-lg p-6">
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-popover-foreground mb-4 text-sm md:text-base">"{testimonial.content}"</p>
                                <div>
                                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                                    <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="w-full py-12 md:py-20 bg-muted">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                            Egyszerű, átlátható árazás
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground">
                            Válaszd ki a tökéletes csomagot a csapatodnak
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {pricingPlans.map((plan, index) => (
                            <div key={index} className={`bg-background border rounded-lg p-6 md:p-8 transition-all duration-200 hover:border-primary/30 ${plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                                {plan.popular && (
                                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                                        Legnépszerűbb
                                    </div>
                                )}
                                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                                <p className="text-muted-foreground mb-4 text-sm md:text-base">{plan.description}</p>
                                <div className="mb-6">
                                    <span className="text-3xl md:text-4xl font-bold text-foreground">{plan.price}</span>
                                    <span className="text-muted-foreground">/hónap</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-center">
                                            <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                            <span className="text-popover-foreground text-sm md:text-base">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/register"
                                    className={`block w-full py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 text-sm md:text-base ${
                                        plan.popular
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                                >
                                    Kezdés
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="w-full py-12 md:py-20">
                <div className="w-full max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <ScrollReveal
                        containerClassName="mb-4"
                        textClassName="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground"
                    >
                        Készen állsz az edzői munkád átalakítására?
                    </ScrollReveal>
                    <p className="text-lg md:text-xl text-muted-foreground mb-8">
                        Csatlakozz több ezer edzőhöz, akik már a Coachify-t használják jobb eredmények eléréséhez
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200"
                        >
                            Ingyenes próba indítása
                            <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-background text-muted-foreground font-semibold rounded-lg border border-border hover:bg-muted transition-all duration-200"
                        >
                            Kapcsolat felvétele
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full bg-primary text-primary-foreground py-8 md:py-12">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="col-span-1 sm:col-span-2 md:col-span-1">
                            <div className="flex items-center mb-4">
                                <div className="relative w-10 h-10">
                                    <div className="absolute inset-0 bg-primary-foreground rounded-lg"></div>
                                    <div className="absolute w-3 h-3 bg-primary rounded top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                                </div>
                                <span className="ml-3 text-xl font-bold">Coachify</span>
                            </div>
                            <p className="text-primary-foreground/80 text-sm md:text-base">
                                Felhatalmazzuk az edzőket és sportolókat, hogy elérjék teljes potenciáljukat adatalapú betekintésekkel.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Termék</h3>
                            <ul className="space-y-2 text-primary-foreground/80 text-sm md:text-base">
                                <li><Link to="/features" className="hover:text-primary-foreground transition-colors">Funkciók</Link></li>
                                <li><Link to="/pricing" className="hover:text-primary-foreground transition-colors">Árazás</Link></li>
                                <li><Link to="/integrations" className="hover:text-primary-foreground transition-colors">Integrációk</Link></li>
                                <li><Link to="/api" className="hover:text-primary-foreground transition-colors">API</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Cég</h3>
                            <ul className="space-y-2 text-primary-foreground/80 text-sm md:text-base">
                                <li><Link to="/about" className="hover:text-primary-foreground transition-colors">Rólunk</Link></li>
                                <li><Link to="/careers" className="hover:text-primary-foreground transition-colors">Karrier</Link></li>
                                <li><Link to="/contact" className="hover:text-primary-foreground transition-colors">Kapcsolat</Link></li>
                                <li><Link to="/blog" className="hover:text-primary-foreground transition-colors">Blog</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Támogatás</h3>
                            <ul className="space-y-2 text-primary-foreground/80 text-sm md:text-base">
                                <li><Link to="/help" className="hover:text-primary-foreground transition-colors">Súgó központ</Link></li>
                                <li><Link to="/documentation" className="hover:text-primary-foreground transition-colors">Dokumentáció</Link></li>
                                <li><Link to="/status" className="hover:text-primary-foreground transition-colors">Állapot</Link></li>
                                <li><Link to="/privacy" className="hover:text-primary-foreground transition-colors">Adatvédelem</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/80">
                        <p className="text-sm md:text-base">&copy; 2025 Coachify. Minden jog fenntartva.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}