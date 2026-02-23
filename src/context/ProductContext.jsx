import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    writeBatch,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const productsCollection = collection(db, 'inventory');

        // Real-time listener
        const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            setProducts(productsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);


    const addProduct = async (product) => {
        try {
            await addDoc(collection(db, 'inventory'), {
                ...product,
                isActive: true, // Default to active
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    };

    const updateProduct = async (id, updatedData) => {
        try {
            const productRef = doc(db, 'inventory', id);
            await updateDoc(productRef, updatedData);
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await deleteDoc(doc(db, 'inventory', id));
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    };

    const updateStock = async (id, quantity) => {
        try {
            const productRef = doc(db, 'inventory', id);
            await updateDoc(productRef, {
                stock: increment(-quantity)
            });
        } catch (error) {
            console.error("Error updating stock:", error);
            throw error;
        }
    };

    return (
        <ProductContext.Provider value={{
            products,
            addProduct,
            updateProduct,
            deleteProduct,
            loading,
            updateStock
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};
