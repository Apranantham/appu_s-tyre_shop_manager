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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Admin status is decided solely by membership in the /admins
                // registry — the same check the Firestore security rules use, so
                // the client and server can never disagree. Seed the first admin
                // manually in the Firebase console (admins/<uid>).
                let admin = false;
                try {
                    const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
                    admin = adminSnap.exists();
                } catch (err) {
                    console.error("Admin check failed:", err);
                }

                const userData = {
                    name: currentUser.displayName || currentUser.email?.split('@')[0] || currentUser.phoneNumber,
                    email: currentUser.email,
                    picture: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}&background=0D8ABC&color=fff`,
                    uid: currentUser.uid,
                    phone: currentUser.phoneNumber,
                };

                setUser({ ...userData, isAdmin: admin });

                // Sync profile to Firestore. We deliberately do NOT persist an
                // isAdmin flag here — a user can write their own /users doc, so
                // trusting a stored flag would be an escalation hole.
                try {
                    await setDoc(doc(db, 'users', currentUser.uid), {
                        ...userData,
                        lastLogin: serverTimestamp()
                    }, { merge: true });
                } catch (err) {
                    console.error("Error syncing user to Firestore:", err);
                }
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
