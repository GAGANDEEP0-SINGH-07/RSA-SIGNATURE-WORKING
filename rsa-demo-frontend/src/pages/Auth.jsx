import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE } from '../utils/api';

/* ── Brand SVG Icons ─────────────────────────────────────────────────────── */
const AppleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.38.07 2.33.74 3.13.8.95-.17 1.86-.88 3.17-.94 1.55-.07 2.76.64 3.52 1.75-3.24 1.89-2.7 6.07.66 7.52-.44 1.12-.98 2.22-2.48 3.75zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
);

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
);

/* ── Spinner ─────────────────────────────────────────────────────────────── */
const Spinner = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

/* ─────────────────────────────────────────────────────────────────────────── */

const Auth = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const gsiInitialized = useRef(false);

    // Initialize Google Identity Services
    useEffect(() => {
        const initGoogle = () => {
            if (window.google && !gsiInitialized.current) {
                gsiInitialized.current = true;
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                });
            }
        };

        // If script is already loaded
        if (window.google) {
            initGoogle();
        } else {
            // Wait for script to load (GSI script is async/defer)
            const interval = setInterval(() => {
                if (window.google) {
                    initGoogle();
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    const handleGoogleResponse = async (response) => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data?.message || 'Google authentication failed.');
                return;
            }

            const { token, user, privateKey } = data.data;

            if (token) localStorage.setItem('rsa_token', token);
            if (user) localStorage.setItem('rsa_user', JSON.stringify(user));
            
            // For Google signups, the private key is only sent once
            if (privateKey) {
                localStorage.setItem('rsa_private_key', privateKey);
                setSuccessMsg(`Welcome, ${user.username}! Your RSA keys have been generated.`);
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Google login error:', err);
            setErrorMsg('Network error during Google authentication.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleClick = () => {
        if (!window.google) {
            setErrorMsg('Google Sign-In is still loading. Please try again in a moment.');
            return;
        }
        window.google.accounts.id.prompt(); // Shows the One Tap UI
    };

    const handleComingSoon = (provider) => {
        setErrorMsg(`${provider} login is currently under maintenance. Please use Google or Email.`);
        setTimeout(() => setErrorMsg(''), 3000);
    };

    // Shared form state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const toggleMode = (e) => {
        e.preventDefault();
        setIsLogin(!isLogin);
        setErrorMsg('');
        setSuccessMsg('');
        setUsername('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        // Basic client-side validation
        if (!isLogin && !username.trim()) {
            setErrorMsg('Please enter your name.');
            return;
        }
        if (!email.trim() || !password.trim()) {
            setErrorMsg('Please fill in all fields.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            const endpoint = isLogin
                ? `${API_BASE}/auth/login`
                : `${API_BASE}/auth/signup`;

            const payload = isLogin ? { email: email.trim(), password } : { username: username.trim(), email: email.trim(), password };
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                // Extract error message from backend response
                const msg = data?.message || data?.error || 'Something went wrong. Please try again.';
                setErrorMsg(msg);
                return;
            }

            // ── Success ──
            const token = data?.data?.token;
            const user = isLogin ? data?.data?.user : {
                id: data?.data?.id,
                username: data?.data?.username,
                email: data?.data?.email,
                publicKey: data?.data?.publicKey,
            };
            const privateKey = data?.data?.privateKey;

            if (token) {
                localStorage.setItem('rsa_token', token);
            }
            if (user) {
                localStorage.setItem('rsa_user', JSON.stringify(user));
            }
            if (privateKey) {
                // IMPORTANT: Store private key securely in localStorage for this session
                localStorage.setItem('rsa_private_key', privateKey);
            }

            if (!isLogin) {
                setSuccessMsg(`Account created! Your username is @${user?.username}. Redirecting…`);
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            console.error('Auth error:', err);
            setErrorMsg('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const sharedFormContent = (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Error / Success Messages */}
            {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{errorMsg}</span>
                </div>
            )}
            {successMsg && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm font-medium animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
                <div className="space-y-2">
                    <label htmlFor="auth-username" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Name</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                        </span>
                        <input
                            id="auth-username"
                            className="w-full bg-[#f9f9f9] border border-[#e0e0e0] rounded-2xl py-3.5 pl-12 pr-4 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                            placeholder="John Doe"
                            type="text"
                            autoComplete="name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
                <label htmlFor="auth-email" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Email</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                    </span>
                    <input
                        id="auth-email"
                        className="w-full bg-[#f9f9f9] border border-[#e0e0e0] rounded-2xl py-3.5 pl-12 pr-4 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                        placeholder="name@company.com"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <label htmlFor="auth-password" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Password</label>
                    {isLogin && (
                        <a className="text-[10px] font-bold text-[#7C3AED] hover:underline uppercase tracking-tight" href="#">Forgot password?</a>
                    )}
                </div>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                    </span>
                    <input
                        id="auth-password"
                        className="w-full bg-[#f9f9f9] border border-[#e0e0e0] rounded-2xl py-3.5 pl-12 pr-12 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                </div>
                {!isLogin && (
                    <p className="text-[11px] text-on-surface-variant ml-1 mt-1">
                        ✦ Your name will be used as your visible profile name.
                    </p>
                )}
            </div>

            <button
                className="w-full py-4 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-bold rounded-full shadow-lg shadow-[#7C3AED]/20 hover:shadow-xl hover:shadow-[#7C3AED]/30 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Spinner />
                        <span>{isLogin ? 'Signing In…' : 'Creating Account…'}</span>
                    </>
                ) : (
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
            </button>
        </form>
    );

    if (isLogin) {
        return (
            <div className="bg-architectural-glow font-body text-on-surface min-h-screen flex flex-col">
                <main className="flex-grow flex items-center justify-center py-12 px-4">
                    <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/20 rounded-3xl md:rounded-[2.5rem] shadow-2xl shadow-on-surface/5 p-8 md:p-12 transition-all duration-300">
                        <header className="text-center mb-10">
                            <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a] mb-2 font-headline">Sign In</h1>
                            <p className="text-on-surface-variant text-sm font-label">Access your architectural signing suite</p>
                        </header>

                        {/* Social Buttons */}
                        <div className="flex justify-between gap-3 mb-8">
                            <button 
                                onClick={() => handleComingSoon('Apple')}
                                type="button" 
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-colors shadow-sm text-sm font-bold text-on-surface"
                            >
                                <AppleIcon /><span>Apple</span>
                            </button>
                            <button 
                                onClick={handleGoogleClick}
                                type="button" 
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-colors shadow-sm text-sm font-bold text-on-surface"
                            >
                                <GoogleIcon /><span>Google</span>
                            </button>
                            <button 
                                onClick={() => handleComingSoon('Facebook')}
                                type="button" 
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-colors shadow-sm text-sm font-bold text-on-surface"
                            >
                                <FacebookIcon /><span>Facebook</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center mb-8">
                            <div className="flex-grow border-t border-outline-variant/20"></div>
                            <span className="flex-shrink mx-4 text-[10px] font-bold text-on-surface-variant tracking-[0.2em]">OR</span>
                            <div className="flex-grow border-t border-outline-variant/20"></div>
                        </div>

                        {sharedFormContent}

                        <div className="mt-8 text-center">
                            <p className="text-xs text-[#666666] font-medium">
                                Don't have an account?{' '}
                                <a className="text-[#7C3AED] font-bold hover:underline cursor-pointer" onClick={toggleMode}>Sign up!</a>
                            </p>
                        </div>
                        <div className="mt-10 text-center">
                            <p className="text-[10px] leading-relaxed text-[#999999] px-4 font-medium">
                                If you continue, you agree to the{' '}
                                <a className="text-[#7C3AED] hover:underline" href="#">Terms of Service</a> &amp;{' '}
                                <a className="text-[#7C3AED] hover:underline" href="#">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-architectural-glow font-body text-on-surface min-h-screen flex flex-col">
            <main className="flex-grow flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/20 rounded-3xl md:rounded-[2.5rem] shadow-2xl shadow-on-surface/5 p-8 md:p-12 transition-all duration-300">
                    <header className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a] mb-2 font-headline">Create an Account</h1>
                        <p className="text-on-surface-variant text-sm font-label">Join the elite standard of digital signatures.</p>
                    </header>

                    {/* Social Buttons */}
                    <div className="flex justify-between gap-3 mb-8">
                        <button 
                            onClick={() => handleComingSoon('Apple')}
                            type="button" 
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-colors shadow-sm text-sm font-bold text-on-surface"
                        >
                            <AppleIcon /><span>Apple</span>
                        </button>
                        <button 
                            onClick={handleGoogleClick}
                            type="button" 
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-colors shadow-sm text-sm font-bold text-on-surface"
                        >
                            <GoogleIcon /><span>Google</span>
                        </button>
                        <button 
                            onClick={() => handleComingSoon('Facebook')}
                            type="button" 
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-colors shadow-sm text-sm font-bold text-on-surface"
                        >
                            <FacebookIcon /><span>Facebook</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center mb-8">
                        <div className="flex-grow border-t border-outline-variant/20"></div>
                        <span className="flex-shrink mx-4 text-[10px] font-bold text-on-surface-variant tracking-[0.2em]">OR</span>
                        <div className="flex-grow border-t border-outline-variant/20"></div>
                    </div>

                    {sharedFormContent}

                    <div className="mt-8 text-center">
                        <p className="text-xs text-[#666666] font-medium">
                            Already have an account?{' '}
                            <a className="text-[#7C3AED] font-bold hover:underline cursor-pointer" onClick={toggleMode}>Sign in!</a>
                        </p>
                    </div>
                    <div className="mt-10 text-center">
                        <p className="text-[10px] leading-relaxed text-[#999999] px-4 font-medium">
                            If you continue, you agree to the{' '}
                            <a className="text-[#7C3AED] hover:underline" href="#">Terms of Service</a> &amp;{' '}
                            <a className="text-[#7C3AED] hover:underline" href="#">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Auth;
