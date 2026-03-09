import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const OldItemContext = createContext();

export const OldItemProvider = ({ children }) => {
    const [oldItemsMaster, setOldItemsMaster] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setOldItemsMaster([]);
            setLoading(false);
            return;
        }

        const oldItemsCollection = collection(db, 'old_items_master');
        const q = query(oldItemsCollection, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const itemsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            setOldItemsMaster(itemsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addMasterItem = async (item) => {
        try {
            await addDoc(collection(db, 'old_items_master'), {
                ...item,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error adding master old item:", error);
            throw error;
        }
    };

    const updateMasterItem = async (id, updatedData) => {
        try {
            const itemRef = doc(db, 'old_items_master', id);
            await updateDoc(itemRef, updatedData);
        } catch (error) {
            console.error("Error updating master old item:", error);
            throw error;
        }
    };

    const deleteMasterItem = async (id) => {
        try {
            await deleteDoc(doc(db, 'old_items_master', id));
        } catch (error) {
            console.error("Error deleting master old item:", error);
            throw error;
        }
    };

    return (
        <OldItemContext.Provider value={{
            oldItemsMaster,
            addMasterItem,
            updateMasterItem,
            deleteMasterItem,
            loading
        }}>
            {children}
        </OldItemContext.Provider>
    );
};

export const useOldItemsMaster = () => {
    const context = useContext(OldItemContext);
    if (context === undefined) {
        throw new Error('useOldItemsMaster must be used within an OldItemProvider');
    }
    return context;
};
