import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    KeyIcon,
    LockIcon,
    LockOpenIcon,
    MailIcon,
    PaperPlaneIcon,
    AlertTriangleIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    XmarkCircleIcon,
    InfoCircleIcon,
    AlertCircleIcon,
    ShieldIcon,
    DocIcon,
    EditIcon,
    TagIcon,
    ArrowRightLeftIcon,
    ChartbarIcon,
    CompassIcon,
    Share2Icon,
    TrayIcon,
    ScissorsIcon,
} from '../components/GlowIcons';

const Landing = () => {
    const observerRef = useRef(null);
    const [showNavbar, setShowNavbar] = useState(true);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 60) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        observerRef.current = observer;

        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return (
        <div className="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed relative overflow-x-hidden min-h-screen">
            {/* Layered Background Container */}
            <div className="fixed inset-0 -z-10 bg-animated-gradient">
                <div className="absolute inset-0 grainy-texture"></div>
                <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] border border-outline-variant/10 rounded-3xl animate-float opacity-30"></div>
                <div className="absolute bottom-[20%] right-[-5%] w-[30vw] h-[50vh] bg-surface-container/20 rounded-[4rem] -rotate-12 animate-float-delayed"></div>
                <div className="absolute top-[40%] right-[10%] w-px h-[60vh] bg-gradient-to-b from-transparent via-outline-variant/20 to-transparent"></div>
                <div className="absolute top-[60%] left-[15%] w-64 h-64 border-2 border-primary/5 rounded-full animate-float"></div>
            </div>

            {/* TopNavBar */}
            <header className={`fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/5 rounded-full border border-outline-variant/10 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-[150%]'}`}>
                <nav className="flex justify-between items-center px-10 py-4">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                        <span className="text-xl font-black tracking-tight text-[#1A202C] dark:text-white font-headline glow-text-hover transition-all duration-300">RSA Sign</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10">
                        <a onClick={(e) => { e.preventDefault(); document.getElementById('sender-section').scrollIntoView({ behavior: 'smooth' }); }} className="text-[#596061] cursor-pointer dark:text-slate-400 font-bold text-sm tracking-tight hover:text-[#1A202C] dark:hover:text-white transition-all duration-300 nav-link-hover glow-text-hover">SENDER</a>
                        <a onClick={(e) => { e.preventDefault(); document.getElementById('receiver-section').scrollIntoView({ behavior: 'smooth' }); }} className="text-[#596061] cursor-pointer dark:text-slate-400 font-bold text-sm tracking-tight hover:text-[#1A202C] dark:hover:text-white transition-all duration-300 nav-link-hover glow-text-hover">RECEIVER</a>
                        <Link to="/auth" onClick={() => localStorage.removeItem('rsa_token')} className="text-[#596061] dark:text-slate-400 font-bold text-sm tracking-tight hover:text-[#1A202C] dark:hover:text-white transition-all duration-300 nav-link-hover glow-text-hover">GET STARTED</Link>
                    </div>
                </nav>
            </header>

            <main className="pt-32 px-8 max-w-7xl mx-auto min-h-screen relative z-10">
                {/* Hero Section */}
                <section className="grid lg:grid-cols-2 gap-16 items-center mb-24 animate-fade-in-up">
                    <div className="space-y-8">
                        <span className="inline-block px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-extrabold tracking-widest font-headline">TRUSTED AUTHENTICATION</span>
                        <h1 className="text-6xl font-black tracking-tight font-headline text-on-surface leading-[1.1]">Sign, Verify &amp; Visualize Every Message with Real RSA Math</h1>
                        <p className="text-lg text-on-surface-variant leading-relaxed max-w-lg font-medium">
                             RSA Sign walks you through the full signature lifecycle — sign with your private key, verify with your public key, and understand every step behind the scenes
                        </p>
                        <div className="flex gap-4">
                            <Link to="/auth" onClick={() => localStorage.removeItem('rsa_token')}>
                                <button className="px-10 py-4 bg-primary text-on-primary rounded-full font-headline font-bold hover:shadow-[0_0_25px_rgba(86,94,116,0.4)] hover:-translate-y-0.5 transition-all duration-300">Get Started</button>
                            </Link>
                            <Link to="/auth" onClick={() => localStorage.removeItem('rsa_token')}>
                                <button className="px-10 py-4 bg-white/50 backdrop-blur-sm text-on-surface border border-outline-variant/10 rounded-full font-headline font-bold hover:bg-surface-container hover:shadow-lg transition-all duration-300">View Demo</button>
                            </Link>
                        </div>
                    </div>
                    <div className="relative rounded-3xl overflow-hidden aspect-square bg-white/40 backdrop-blur-md p-8 border border-white/50 shadow-2xl transition-transform duration-500 hover:scale-[1.02] hover:shadow-primary/10">
                        <img alt="Minimalist architectural structure with clean lines and soft shadows" className="w-full h-full object-cover rounded-3xl shadow-lg opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHPoeXd4ghueIDjVaCdAW5SgxTav0ZwSOcwyUJuZYO8UqyRGIooOjtlxZwaPc_CEeHNHNQQ5BfnVJWIXfSZBmPxjaPTqMxJZ5cBPbwpq-n4kIpllVnV3A5RoQIaVe5J25ocqPA6890P32BS9tOVGf_qhwTWtLvYtiFzoP7mNgmuiSrsGdxA7MxSv6ZzEWDg4E0WnqyVfctyrfwWvDtLirodZzfesgP0115PLkUusmRSbdTJ3PpR6kuGtXv_M-znXrjTMSnOG-g5qA"/>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
                    </div>
                </section>

                {/* Section 1: CRYPTOGRAPHY BASICS */}
                <section className="reveal bg-white/60 backdrop-blur-md rounded-[3rem] py-24 px-8 mb-24 border border-white/40 shadow-xl shadow-black/[0.02]">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <span className="inline-block px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-extrabold tracking-widest font-headline">TRUSTED AUTHENTICATION</span>
                            <h2 className="text-5xl font-black tracking-tight font-headline text-on-surface">CRYPTOGRAPHY BASICS</h2>
                            <h3 className="text-2xl font-bold font-headline text-primary">What is RSA?</h3>
                            <p className="text-lg text-on-surface-variant leading-relaxed font-medium">
                                RSA stands for Rivest–Shamir–Adleman. It is an asymmetric cryptography system used to sign, encrypt, and verify data. The algorithm behind every secure digital signature is explained simply: it's based on the mathematics of large prime numbers.
                            </p>
                            <div className="flex gap-8 items-start pt-4">
                                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex-1 transition-all duration-300 hover:shadow-lg glow-hover">
                                    {/* vpn_key → KeyIcon */}
                                    <KeyIcon className="text-primary mb-3" width={24} height={24} />
                                    <h4 className="font-bold mb-1">Private Key</h4>
                                    <p className="text-sm opacity-70">"Keep it secret" - Used to SIGN documents digitally.</p>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex-1 transition-all duration-300 hover:shadow-lg glow-hover">
                                    {/* key → KeyIcon variant */}
                                    <KeyIcon className="text-primary mb-3" width={24} height={24} />
                                    <h4 className="font-bold mb-1">Public Key</h4>
                                    <p className="text-sm opacity-70">"Share with everyone" - Used to VERIFY signatures.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-container-low/40 backdrop-blur-md rounded-3xl p-12 flex items-center justify-center min-h-[400px] border border-white/50 transition-all duration-500 hover:shadow-inner">
                            <div className="text-center space-y-6">
                                <div className="flex items-center gap-4 justify-center">
                                    <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center font-black text-xl hover:scale-110 transition-transform cursor-default">P</div>
                                    <span className="text-2xl font-black">×</span>
                                    <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center font-black text-xl hover:scale-110 transition-transform cursor-default">Q</div>
                                    <span className="text-2xl font-black">=</span>
                                    <div className="px-8 py-4 rounded-2xl bg-on-surface text-surface font-black text-2xl shadow-lg glow-hover transition-all cursor-default">Modulus N</div>
                                </div>
                                <p className="text-sm font-bold tracking-widest uppercase opacity-40">The Mathematical Foundation</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Why RSA for Digital Signatures? */}
                <section className="reveal py-24 px-8 mb-24">
                    <div className="max-w-7xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black font-headline tracking-tight">Why RSA for Digital Signatures?</h2>
                            <p className="text-on-surface-variant max-w-2xl mx-auto font-medium">Standardizing trust through immutable cryptographic properties.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white/40 backdrop-blur-md p-10 rounded-3xl shadow-sm border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 glow-hover group">
                                <div className="w-14 h-14 bg-primary-container/30 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                                    {/* lock → LockIcon */}
                                    <LockIcon className="text-primary" width={28} height={28} />
                                </div>
                                <h3 className="text-2xl font-black font-headline mb-4">Authenticity</h3>
                                <p className="text-on-surface-variant font-medium">Proves exactly who sent the message, eliminating any possibility of impersonation.</p>
                            </div>
                            <div className="bg-white/40 backdrop-blur-md p-10 rounded-3xl shadow-sm border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 glow-hover group">
                                <div className="w-14 h-14 bg-secondary-container/30 rounded-2xl flex items-center justify-center text-secondary mb-8 group-hover:scale-110 transition-transform">
                                    {/* description → DocIcon */}
                                    <DocIcon className="text-secondary" width={28} height={28} />
                                </div>
                                <h3 className="text-2xl font-black font-headline mb-4">Integrity</h3>
                                <p className="text-on-surface-variant font-medium">Guarantees that the message was not tampered with after signing. Any change breaks the seal.</p>
                            </div>
                            <div className="bg-white/40 backdrop-blur-md p-10 rounded-3xl shadow-sm border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 glow-hover group">
                                <div className="w-14 h-14 bg-error-container/20 rounded-2xl flex items-center justify-center text-error mb-8 group-hover:scale-110 transition-transform">
                                    {/* block → ShieldIcon (closest semantic match) */}
                                    <ShieldIcon className="text-error" width={28} height={28} />
                                </div>
                                <h3 className="text-2xl font-black font-headline mb-4">Non-Repudiation</h3>
                                <p className="text-on-surface-variant font-medium">Prevents the signer from later denying they sent the message. The math is undeniable.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: How Keys are Related */}
                <section className="reveal py-24 px-8 mb-24">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col items-center text-center space-y-12">
                            <h2 className="text-4xl font-black font-headline tracking-tight">How Keys are Related</h2>
                            <div className="relative w-full py-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
                                <div className="flex flex-col items-center gap-2 group cursor-default">
                                    <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-primary shadow-lg font-black text-xl group-hover:scale-110 transition-transform">P × Q</div>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase">Primes</span>
                                </div>
                                <div className="hidden md:block flex-1 h-1 bg-gradient-to-r from-primary/20 via-primary/80 to-on-surface rounded-full"></div>
                                <div className="flex flex-col items-center gap-2 group cursor-default">
                                    <div className="px-10 py-6 bg-on-surface text-surface rounded-2xl shadow-2xl font-black text-2xl group-hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all">Modulus N</div>
                                    <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">The Product</span>
                                </div>
                                <div className="hidden md:block flex-1 h-1 bg-gradient-to-r from-on-surface to-secondary/20 rounded-full"></div>
                                <div className="flex flex-col items-center gap-2 group cursor-default">
                                    <div className="flex -space-x-4">
                                        <div className="w-20 h-20 bg-secondary text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg font-black text-xl group-hover:-translate-x-2 transition-transform">Prv</div>
                                        <div className="w-20 h-20 bg-primary-container text-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg font-black text-xl group-hover:translate-x-2 transition-transform">Pub</div>
                                    </div>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase">Key Pair</span>
                                </div>
                            </div>
                            <p className="text-lg text-on-surface-variant max-w-3xl font-medium leading-relaxed">
                                This shows where keys come from mathematically without being too complex. The public and private keys are intrinsically linked by the same Modulus N, yet it's computationally impossible to derive the private key from the public one.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SENDER SIDE Section */}
                <section id="sender-section" className="reveal bg-white py-24 px-8 mb-24 rounded-[3rem] shadow-sm border border-outline-variant/5">
                    <div className="max-w-7xl mx-auto space-y-20">
                        <div className="text-center space-y-6">
                            <span className="inline-block px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-extrabold tracking-widest font-headline uppercase">SENDER SIDE</span>
                            <h2 className="text-5xl font-black tracking-tight font-headline text-on-surface">How Does the Sender Sign a Message?</h2>
                            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto font-medium">Every secure message starts here — with a private key and a signature.</p>
                        </div>

                        <div className="relative">
                            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px border-t-2 border-dotted border-primary/30 -translate-y-12"></div>
                            <div className="grid lg:grid-cols-5 gap-8 relative">
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">1</div>
                                    {/* vpn_key → KeyIcon */}
                                    <KeyIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Generate Key Pair</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Private Key + Public Key are created</p>
                                    <div className="w-full h-1 bg-blue-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">2</div>
                                    {/* edit_note → EditIcon */}
                                    <EditIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Write the Message</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Plain text message that you want to send</p>
                                    <div className="w-full h-1 bg-blue-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">3</div>
                                    {/* tag → TagIcon */}
                                    <TagIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Hash the Message</h4>
                                    <p className="text-xs font-bold text-primary uppercase tracking-tighter">SHA-256</p>
                                    <p className="text-sm text-on-surface-variant leading-tight">Converts message into fixed length digest</p>
                                    <div className="w-full h-1 bg-blue-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">4</div>
                                    {/* lock → LockIcon */}
                                    <LockIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Sign the Hash</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Private key encrypts the hash → Signature produced</p>
                                    <div className="w-full h-1 bg-blue-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">5</div>
                                    {/* send → PaperPlaneIcon */}
                                    <PaperPlaneIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Send to Receiver</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Sender sends Message + Signature together</p>
                                    <div className="w-full h-1 bg-blue-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12 pt-8">
                            <div className="bg-blue-50/50 rounded-3xl p-10 border border-blue-100/50 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    <span className="text-xs font-black tracking-widest text-primary uppercase">SENDER OUTPUT</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                                        {/* file icon → DocIcon */}
                                        <DocIcon className="text-primary/60" width={24} height={24} />
                                        <div>
                                            <p className="text-[10px] font-black opacity-40 uppercase">Original Message</p>
                                            <p className="font-bold text-on-surface">"Hello World"</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                                        {/* edit icon → EditIcon */}
                                        <EditIcon className="text-primary/60" width={24} height={24} />
                                        <div>
                                            <p className="text-[10px] font-black opacity-40 uppercase">Digital Signature</p>
                                            <p className="font-mono text-xs text-primary truncate max-w-[200px]">a3f9bc...087e52d</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                                        {/* key icon → KeyIcon */}
                                        <KeyIcon className="text-primary/60" width={24} height={24} />
                                        <div>
                                            <p className="text-[10px] font-black opacity-40 uppercase">Public Key</p>
                                            <p className="text-xs font-medium text-on-surface-variant italic">shared openly with everyone</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between gap-8">
                                <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 text-center space-y-4">
                                    <p className="text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Mathematical Logic</p>
                                    <div className="font-mono text-lg font-bold text-primary space-y-2">
                                        <p>Hash(Message) → H</p>
                                        <p>H ^ d mod n → Signature (S)</p>
                                    </div>
                                    <p className="text-[10px] font-medium opacity-60">where d = Private Key exponent, n = Modulus</p>
                                </div>

                                <div className="bg-on-surface p-8 rounded-3xl text-surface shadow-xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 text-white opacity-5 rotate-12 transition-transform group-hover:scale-110 duration-700">
                                        {/* warning → AlertTriangleIcon */}
                                        <AlertTriangleIcon className="text-white" width={96} height={96} />
                                    </div>
                                    <div className="flex gap-4 relative z-10">
                                        {/* warning inline → AlertTriangleIcon */}
                                        <AlertTriangleIcon className="text-white/80 shrink-0" width={24} height={24} />
                                        <p className="text-sm font-medium leading-relaxed">
                                            <span className="font-black text-white">Remember:</span> The sender NEVER sends the Private Key. Only the Message + Signature + Public Key are shared with the receiver.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/10">
                            <p className="text-xl font-headline font-bold text-on-surface-variant text-center md:text-left">Message signed! Now see how the Receiver verifies it <span className="hidden md:inline">→</span></p>
                            <button className="px-10 py-4 bg-primary text-on-primary rounded-full font-headline font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group">
                                Go to Receiver Side
                                {/* arrow_forward → ArrowRightIcon */}
                                <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" width={20} height={20} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* RECEIVER SIDE Section */}
                <section id="receiver-section" className="reveal bg-white py-24 px-8 mb-24 rounded-[3rem] shadow-sm border border-outline-variant/5">
                    <div className="max-w-7xl mx-auto space-y-20">
                        <div className="text-center space-y-6">
                            <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-extrabold tracking-widest font-headline uppercase">RECEIVER SIDE</span>
                            <h2 className="text-5xl font-black tracking-tight font-headline text-on-surface">How Does the Receiver Verify a Message?</h2>
                            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto font-medium">Trust is verified mathematically — not by assumption.</p>
                        </div>

                        <div className="relative">
                            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px border-t-2 border-dotted border-secondary/30 -translate-y-12"></div>
                            <div className="grid lg:grid-cols-5 gap-8 relative">
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-secondary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">1</div>
                                    <TrayIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Receive Ciphertext</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Receiver gets the encrypted ciphertext from the sender</p>
                                    <div className="w-full h-1 bg-purple-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-secondary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">2</div>
                                    <LockOpenIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Decrypt with Private Key</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Uses their own Private Key to decrypt the ciphertext</p>
                                    <div className="w-full h-1 bg-purple-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-secondary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">3</div>
                                    <ScissorsIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Separate Payload</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Split decrypted payload into Message &amp; Extracted Signature</p>
                                    <div className="w-full h-1 bg-purple-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-secondary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">4</div>
                                    <ArrowRightLeftIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Verify Signature</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Message + Signature + Sender's Public Key → Verification</p>
                                    <div className="w-full h-1 bg-purple-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                                <div className="stagger-reveal bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-md shadow-black/[0.02] flex flex-col items-center text-center gap-4 min-h-[300px] hover:-translate-y-2 hover:shadow-xl hover:shadow-secondary/10 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-headline font-bold text-sm mb-2 shadow-md">5</div>
                                    <ShieldIcon className="text-[#1A202C]" width={36} height={36} />
                                    <h4 className="font-black font-headline text-lg">Result</h4>
                                    <p className="text-sm text-on-surface-variant leading-tight">Signature Valid → Authentic; Invalid → Tampered</p>
                                    <div className="w-full h-1 bg-purple-100 rounded-full mt-auto overflow-hidden">
                                        <div className="w-full h-full bg-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12 pt-8">
                            {/* Left column: Receiver output items — mirrors Sender Output */}
                            <div className="bg-purple-50/50 rounded-3xl p-10 border border-purple-100/50 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                                    <span className="text-xs font-black tracking-widest text-secondary uppercase">VERIFICATION RESULT</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                                        <DocIcon className="text-secondary/60" width={24} height={24} />
                                        <div>
                                            <p className="text-[10px] font-black opacity-40 uppercase">Received Message</p>
                                            <p className="font-bold text-on-surface">"Hello World"</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                                        <ArrowRightLeftIcon className="text-secondary/60" width={24} height={24} />
                                        <div>
                                            <p className="text-[10px] font-black opacity-40 uppercase">Re-computed Hash H'</p>
                                            <p className="font-mono text-xs text-secondary truncate max-w-[200px]">SHA256(message) → digest</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6l2.5 2.5L10 4" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black opacity-40 uppercase">Comparison</p>
                                            <p className="text-xs font-medium text-green-700 font-mono">H == H' → Signature Valid</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right column: Math formula + warning card — mirrors sender's right column */}
                            <div className="flex flex-col justify-between gap-8">
                                <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 text-center space-y-4">
                                    <p className="text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Mathematical Verification</p>
                                    <div className="font-mono text-lg font-bold text-secondary space-y-2">
                                        <p>S ^ e mod n → H'</p>
                                        <div className="h-px w-20 bg-outline-variant/20 mx-auto my-3"></div>
                                        <p className="flex items-center justify-center gap-2 text-green-700 text-sm">
                                            H == H' → Valid
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                                                <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6l2.5 2.5L10 4" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </span>
                                        </p>
                                        <p className="flex items-center justify-center gap-2 text-red-600 text-sm">
                                            H ≠ H' → Invalid
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
                                                <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                            </span>
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-medium opacity-60">e = Public Key exponent, n = Modulus</p>
                                </div>

                                <div className="bg-on-surface p-8 rounded-3xl text-surface shadow-xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 text-white opacity-5 rotate-12 transition-transform group-hover:scale-110 duration-700">
                                        <InfoCircleIcon className="text-white" width={96} height={96} />
                                    </div>
                                    <div className="flex gap-4 relative z-10">
                                        <AlertCircleIcon className="text-white/80 shrink-0" width={24} height={24} />
                                        <p className="text-sm font-medium leading-relaxed">
                                            <span className="font-black text-white">Remember:</span> The receiver NEVER needs the sender's Private Key. Verification only requires the Message + Signature + Public Key.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-secondary/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-secondary/10">
                            <p className="text-xl font-headline font-bold text-on-surface-variant text-center md:text-left">Now that you understand both sides — See the complete RSA flow in action <span className="hidden md:inline">→</span></p>
                            <Link to="/auth" onClick={() => localStorage.removeItem('rsa_token')}>
                                <button className="px-10 py-4 bg-secondary text-white rounded-full font-headline font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group">
                                    See Full Working
                                    <ChartbarIcon className="group-hover:translate-x-1 transition-transform" width={20} height={20} />
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="reveal bg-primary py-20 px-8 text-on-primary rounded-[3rem] mb-24 shadow-2xl shadow-primary/20">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-3xl font-black font-headline">Ready for the deep dive?</h2>
                            <p className="text-lg opacity-80 font-medium">Explore the low-level math behind RSA.</p>
                        </div>
                        <Link to="/auth" onClick={() => localStorage.removeItem('rsa_token')}>
                            <button className="px-12 py-5 bg-white text-on-surface rounded-full font-headline font-bold text-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 flex items-center gap-3 group">
                                View Working Demo
                                {/* arrow_forward → ArrowRightIcon */}
                                <ArrowRightIcon className="transition-transform group-hover:translate-x-1" width={22} height={22} />
                            </button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white/40 backdrop-blur-xl py-20 px-8 relative z-10 border-t border-outline-variant/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
                    <div className="space-y-6 max-w-xs">
                        <h2 className="text-2xl font-black font-headline tracking-tighter glow-text-hover transition-all duration-300 inline-block cursor-default">RSA Sign</h2>
                        <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                            Elevating digital trust through minimalist engineering and architectural precision. The standard for modern enterprise signatures.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <h4 className="font-black text-xs tracking-widest uppercase">PLATFORM</h4>
                            <ul className="space-y-2 text-sm text-on-surface-variant font-medium">
                                <li><a className="hover:text-primary transition-colors nav-link-hover" href="#">SENDER Hub</a></li>
                                <li><a className="hover:text-primary transition-colors nav-link-hover" href="#">RECEIVER Portal</a></li>
                                <li><a className="hover:text-primary transition-colors nav-link-hover" href="#">WORKING API</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-black text-xs tracking-widest uppercase">LEGAL</h4>
                            <ul className="space-y-2 text-sm text-on-surface-variant font-medium">
                                <li><a className="hover:text-primary transition-colors nav-link-hover" href="#">Privacy</a></li>
                                <li><a className="hover:text-primary transition-colors nav-link-hover" href="#">Terms</a></li>
                                <li><a className="hover:text-primary transition-colors nav-link-hover" href="#">Compliance</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-black text-xs tracking-widest uppercase">CONNECT</h4>
                            <div className="flex gap-4">
                                {/* language → CompassIcon */}
                                <CompassIcon className="text-on-surface-variant cursor-pointer hover:text-primary transition-all" width={24} height={24} />
                                {/* mail → MailIcon */}
                                <MailIcon className="text-on-surface-variant cursor-pointer hover:text-primary transition-all" width={24} height={24} />
                                {/* hub → Share2Icon */}
                                <Share2Icon className="text-on-surface-variant cursor-pointer hover:text-primary transition-all" width={24} height={24} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-outline-variant/10 text-center">
                    <p className="text-xs text-on-surface-variant opacity-60 font-medium">© 2024 RSA Sign Architectural Systems. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
