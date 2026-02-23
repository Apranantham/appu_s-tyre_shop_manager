import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const [shopDetails, setShopDetails] = useState({
        shopName: 'TurboTyre Central',
        shopAddress: '123, Auto Garage Street, Chennai, TN 600001',
        shopPhone: '+91 98765 43210'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // We store global shop settings in a fixed document
        // In a multi-tenant app, this would be user-specific, 
        // but for this shop manager, we can use a "general/shopProfile" doc
        const settingsRef = doc(db, 'settings', 'shopProfile');

        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setShopDetails(docSnap.data());
            } else {
                // If it doesn't exist yet, we can initialize it with defaults
                // OR just leave the default state
            }
            setLoading(false);
        }, (err) => {
            console.error("Settings listener error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateShopDetails = async (newDetails) => {
        try {
            const settingsRef = doc(db, 'settings', 'shopProfile');
            await setDoc(settingsRef, newDetails, { merge: true });
        } catch (error) {
            console.error("Error updating shop details:", error);
            throw error;
        }
    };

    return (
        <SettingsContext.Provider value={{ shopDetails, updateShopDetails, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
