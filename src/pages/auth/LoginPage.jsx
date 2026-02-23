import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Shield, Lock, ChevronRight, Mail, Phone, UserPlus, LogIn, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
    const {
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithPhonePassword,
        registerWithPhonePassword,
        resetPassword,
        isAuthenticated,
        loading
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    // UI States
    const [authMode, setAuthMode] = useState('google'); // 'google', 'email', 'phone'
    const [isSignup, setIsSignup] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    // Visibility States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phonePassword, setPhonePassword] = useState('');
    const [phoneConfirmPassword, setPhoneConfirmPassword] = useState('');

    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
        if (isAuthenticated && !loading) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, loading, navigate, from]);

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoadingAction(true);
            await loginWithGoogle();
        } catch (err) {
            setError('Google sign-in failed. Please try again.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoadingAction(true);
        try {
            if (isSignup) {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                await registerWithEmail(email, password);
            } else {
                await loginWithEmail(email, password);
            }
        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please sign in.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError(err.message || 'Authentication failed');
            }
        } finally {
            setLoadingAction(false);
        }
    };

    const handlePhoneAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoadingAction(true);
        try {
            if (isSignup) {
                if (phonePassword !== phoneConfirmPassword) {
                    throw new Error("Passwords do not match");
                }
                await registerWithPhonePassword(phoneNumber, phonePassword);
            } else {
                await loginWithPhonePassword(phoneNumber, phonePassword);
            }
        } catch (err) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Invalid phone number or password. Please try again.');
            } else {
                setError(err.message || 'Authentication failed');
            }
        } finally {
            setLoadingAction(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setError('');
        setSuccessMessage('');
        setLoadingAction(true);
        try {
            await resetPassword(email);
            setSuccessMessage('Password reset email sent! Please check your inbox.');
        } catch (err) {
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setLoadingAction(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-dark)] text-white flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 text-[var(--color-primary)]">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-current rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-blue-900 rounded-2xl mb-4 shadow-xl transform -rotate-3">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter italic">TURBO<span className="text-[var(--color-primary)]">TYRE</span></h1>
                    <p className="text-[var(--color-text-gray)] font-bold uppercase tracking-[0.2em] text-[8px] mt-1">Professional Management Suite</p>
                </div>

                <Card className="p-1 border-[var(--color-border)] bg-[var(--color-bg-card)]/50 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex p-1 bg-[var(--color-bg-dark)]/80 rounded-t-[1.8rem] mb-4">
                        <button
                            onClick={() => { setAuthMode('google'); setError(''); setIsSignup(false); }}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-all ${authMode === 'google' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-gray)] hover:text-white'}`}
                        >
                            Google
                        </button>
                        <button
                            onClick={() => { setAuthMode('email'); setError(''); setIsSignup(false); }}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-all ${authMode === 'email' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-gray)] hover:text-white'}`}
                        >
                            Email
                        </button>
                        <button
                            onClick={() => { setAuthMode('phone'); setError(''); setIsSignup(false); }}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-all ${authMode === 'phone' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-gray)] hover:text-white'}`}
                        >
                            Phone
                        </button>
                    </div>

                    <div className="px-6 pb-8 pt-2">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-xs text-center font-medium flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {successMessage}
                            </div>
                        )}

                        {authMode === 'google' && (
                            <div className="space-y-6 py-4 text-center">
                                <h2 className="text-xl font-bold">Welcome Back</h2>
                                <p className="text-sm text-[var(--color-text-gray)] px-4">Fastest way to access your dashboard using your existing Google account.</p>
                                <Button
                                    className="w-full h-14 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-dark)] text-[var(--color-text-white)] font-bold rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 group"
                                    onClick={handleGoogleLogin}
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? (
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {authMode === 'email' && (
                            <form onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth} className="space-y-4 py-2">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold">
                                        {isForgotPassword ? 'Reset Password' : (isSignup ? 'Create Account' : 'Welcome Back')}
                                    </h2>
                                    <p className="text-xs text-[var(--color-text-gray)] mt-1">
                                        {isForgotPassword
                                            ? 'Enter your email to receive a reset link'
                                            : (isSignup ? 'Start managing your shop today' : 'Sign in to continue to your dashboard')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl h-12 pl-11 pr-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                                            placeholder="name@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {!isForgotPassword && (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)]">Password</label>
                                                {!isSignup && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsForgotPassword(true)}
                                                        className="text-[10px] text-[var(--color-primary)] font-bold hover:underline"
                                                    >
                                                        Forgot?
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl h-12 pl-11 pr-12 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-gray)] hover:text-white"
                                                >
                                                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {isSignup && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Confirm Password</label>
                                                <div className="relative">
                                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl h-12 pl-11 pr-12 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-gray)] hover:text-white"
                                                    >
                                                        {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-[var(--color-primary)] hover:bg-blue-600 font-bold rounded-2xl flex items-center justify-center mt-6 shadow-lg shadow-blue-500/20"
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            {isForgotPassword
                                                ? <Mail className="h-4 w-4 mr-2" />
                                                : (isSignup ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />)}
                                            {isForgotPassword
                                                ? 'Send Reset Link'
                                                : (isSignup ? 'Create Account' : 'Sign In')}
                                        </>
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isForgotPassword) {
                                            setIsForgotPassword(false);
                                        } else {
                                            setIsSignup(!isSignup);
                                        }
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="w-full text-center text-xs text-[var(--color-text-gray)] hover:text-white mt-4"
                                >
                                    {isForgotPassword
                                        ? 'Back to Sign In'
                                        : (isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up")}
                                </button>
                            </form>
                        )}

                        {authMode === 'phone' && (
                            <form onSubmit={handlePhoneAuth} className="space-y-4 py-2">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold">{isSignup ? 'Register Phone' : 'Phone Login'}</h2>
                                    <p className="text-xs text-[var(--color-text-gray)] mt-1">
                                        {isSignup ? 'Set a password for your phone number' : 'Login using your phone and password'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Mobile Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl h-12 pl-11 pr-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                                            placeholder="9876543210"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={phonePassword}
                                            onChange={(e) => setPhonePassword(e.target.value)}
                                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl h-12 pl-11 pr-12 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-gray)] hover:text-white"
                                        >
                                            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {isSignup && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={phoneConfirmPassword}
                                                onChange={(e) => setPhoneConfirmPassword(e.target.value)}
                                                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl h-12 pl-11 pr-12 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-gray)] hover:text-white"
                                            >
                                                {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-[var(--color-primary)] hover:bg-blue-600 font-bold rounded-2xl flex items-center justify-center mt-6 shadow-lg shadow-blue-500/20"
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            {isSignup ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                                            {isSignup ? 'Register' : 'Login'}
                                        </>
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMessage(''); }}
                                    className="w-full text-center text-xs text-[var(--color-text-gray)] hover:text-white mt-4"
                                >
                                    {isSignup ? 'Already registered? Login' : "First time? Register your phone"}
                                </button>
                            </form>
                        )}
                    </div>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-[var(--color-text-gray)] opacity-50 font-medium">
                        &copy; 2026 TurboTyre Tech Solutions.<br />
                        Secure Login Path Activated.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
