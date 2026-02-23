import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser({
                    name: currentUser.displayName || currentUser.email?.split('@')[0] || currentUser.phoneNumber,
                    email: currentUser.email,
                    picture: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}&background=0D8ABC&color=fff`,
                    uid: currentUser.uid,
                    phone: currentUser.phoneNumber,
                    isAdmin: currentUser.uid === 'hPGom0p4tAfZf37Bqly6erLYkZm1' ||
                        (currentUser.email || '').toLowerCase().includes('apranantham') ||
                        (currentUser.email || '').toLowerCase().includes('appuananth')
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Google Login failed:", error);
            throw error;
        }
    };

    const registerWithEmail = async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error("Email registration failed:", error);
            throw error;
        }
    };

    const loginWithEmail = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error("Email login failed:", error);
            throw error;
        }
    };

    // Phone + Password Helpers (Synthetic Email Mapping)
    const getSyntheticEmail = (phone) => {
        // Remove non-numeric characters and create a unique internal domain email
        const cleanPhone = phone.replace(/\D/g, '');
        return `${cleanPhone}@turbotyre.internal`;
    };

    const registerWithPhonePassword = async (phone, password) => {
        const email = getSyntheticEmail(phone);
        return await registerWithEmail(email, password);
    };

    const loginWithPhonePassword = async (phone, password) => {
        const email = getSyntheticEmail(phone);
        return await loginWithEmail(email, password);
    };

    const getRecaptchaVerifier = (containerId) => {
        return new RecaptchaVerifier(auth, containerId, {
            'size': 'invisible'
        });
    };

    const signInWithPhone = async (phoneNumber, appVerifier) => {
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            return confirmationResult;
        } catch (error) {
            console.error("Phone sign in failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Password reset failed:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isAdmin: user?.isAdmin || false,
            login: loginWithGoogle, // Keep generic 'login' as Google for backward compat
            loginWithGoogle,
            registerWithEmail,
            loginWithEmail,
            registerWithPhonePassword,
            loginWithPhonePassword,
            resetPassword,
            getRecaptchaVerifier,
            signInWithPhone,
            logout,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
