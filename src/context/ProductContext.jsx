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
import { logStockMovements } from '../utils/stockLog';

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
            // A manual stock correction in the edit form is a stock movement
            // like any other — without this, the audit trail has a hole exactly
            // where hand adjustments happen.
            const before = products.find(p => p.id === id);
            await updateDoc(productRef, updatedData);
            if (
                before &&
                updatedData.stock !== undefined &&
                Number(updatedData.stock) !== Number(before.stock)
            ) {
                logStockMovements({
                    productId: id,
                    productName: updatedData.name || before.name || '',
                    delta: Number(updatedData.stock) - Number(before.stock || 0),
                    reason: 'adjustment',
                    note: 'Manual edit'
                }, user);
            }
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

    // Deducts `quantity` from stock (negative quantity returns stock).
    // `meta` feeds the stock-movement audit trail.
    const updateStock = async (id, quantity, meta = {}) => {
        try {
            // Untracked products (blank/null stock) are never decremented or
            // logged — they behave like unlimited-stock / service items.
            const liveProduct = products.find(p => p.id === id);
            if (liveProduct && (liveProduct.stock === null || liveProduct.stock === undefined || liveProduct.stock === '')) {
                return;
            }
            const productRef = doc(db, 'inventory', id);
            await updateDoc(productRef, {
                stock: increment(-quantity)
            });
            logStockMovements({
                productId: id,
                productName: meta.productName || products.find(p => p.id === id)?.name || '',
                delta: -quantity,
                reason: meta.reason || 'sale',
                refId: meta.refId,
                note: meta.note
            }, user);
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
