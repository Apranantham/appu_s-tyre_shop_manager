import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    writeBatch,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setInvoices([]);
            setLoading(false);
            return;
        }

        const billingCollection = collection(db, 'billing');
        let q;

        if (user.isAdmin) {
            // Admin sees everything
            q = query(billingCollection);
        } else {
            // Regular user sees only their own
            q = query(
                billingCollection,
                where('createdBy', '==', user.uid)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const invoicesData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }))
                // Sort client-side to avoid requiring a composite index
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            setInvoices(invoicesData);
            setLoading(false);
        }, (err) => {
            console.error("Billing Snapshot Error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addInvoice = async (invoice) => {
        if (!user) throw new Error("Authentication required to create invoice");
        try {
            const plainInvoice = JSON.parse(JSON.stringify(invoice));
            const docRef = await addDoc(collection(db, 'billing'), {
                ...plainInvoice,
                createdBy: user.uid,
                creatorEmail: user.email,
                creatorName: user.name,
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding invoice:", error);
            throw error;
        }
    };

    const updateInvoice = async (id, updatedData) => {
        try {
            const invoiceRef = doc(db, 'billing', String(id));
            const plainData = JSON.parse(JSON.stringify(updatedData));
            await updateDoc(invoiceRef, plainData);
        } catch (error) {
            console.error("Error updating invoice:", error);
            throw error;
        }
    };

    const deleteInvoice = async (id) => {
        try {
            await deleteDoc(doc(db, 'billing', String(id)));
        } catch (error) {
            console.error("Error deleting invoice:", error);
            throw error;
        }
    };

    const getCustomerHistory = (idOrPhone) => {
        return invoices.filter(inv =>
            inv.customer?.phone === idOrPhone ||
            inv.customer?.name === idOrPhone ||
            inv.id === idOrPhone
        );
    };

    const updateCustomerInfo = async (phone, newInfo) => {
        const customerInvoices = invoices.filter(inv => inv.customer?.phone === phone);
        const updatePromises = customerInvoices.map(inv => {
            const updatedCustomer = { ...inv.customer, ...newInfo };
            return updateInvoice(inv.id, { customer: updatedCustomer });
        });
        await Promise.all(updatePromises);
    };

    return (
        <InvoiceContext.Provider value={{
            invoices,
            addInvoice,
            updateInvoice,
            deleteInvoice,
            getCustomerHistory,
            updateCustomerInfo,
            loading,
            error
        }}>
            {children}
        </InvoiceContext.Provider>
    );
};

export const useInvoices = () => {
    const context = useContext(InvoiceContext);
    if (context === undefined) {
        throw new Error('useInvoices must be used within a InvoiceProvider');
    }
    return context;
};
