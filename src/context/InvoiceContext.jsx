import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    query,
    where,
    runTransaction,
    increment,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [deletedInvoices, setDeletedInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setInvoices([]);
            setDeletedInvoices([]);
            setLoading(false);
            return;
        }

        const billingCollection = collection(db, 'billing');
        let q;

        if (user.isAdmin) {
            // Admin sees everything
            q = query(billingCollection);
        } else {
            // Regular user sees only their own bills/customers
            q = query(
                billingCollection,
                where('createdBy', '==', user.uid)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Invoice snapshot received. Doc count:", snapshot.size);
            const allFetched = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            // Sort client-side to avoid complex Firestore indexes
            const sorted = allFetched.sort((a, b) => new Date(b.date) - new Date(a.date));

            setInvoices(sorted.filter(inv => inv.isDeleted !== true));
            setDeletedInvoices(sorted.filter(inv => inv.isDeleted === true));
            setLoading(false);
        }, (err) => {
            console.error("Invoice listener error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addInvoice = async (invoice) => {
        if (!user) throw new Error("Auth required");
        try {
            const plainInvoice = JSON.parse(JSON.stringify(invoice));
            const settingsRef = doc(db, 'settings', 'shopProfile');
            const billingCollection = collection(db, 'billing');

            return await runTransaction(db, async (transaction) => {
                const settingsSnap = await transaction.get(settingsRef);
                let nextNo = 101;
                if (settingsSnap.exists()) {
                    nextNo = settingsSnap.data().nextInvoiceNumber || 101;
                }

                const newInvoiceRef = doc(billingCollection);
                transaction.set(newInvoiceRef, {
                    ...plainInvoice,
                    invoiceNo: nextNo,
                    createdBy: user.uid,
                    creatorEmail: user.email,
                    creatorName: user.name,
                    createdAt: new Date().toISOString(),
                    isDeleted: false
                });

                transaction.set(settingsRef, {
                    nextInvoiceNumber: nextNo + 1
                }, { merge: true });

                return newInvoiceRef.id;
            });
        } catch (err) {
            console.error("Add invoice error:", err);
            throw err;
        }
    };

    const updateInvoice = async (id, updatedData) => {
        try {
            const invoiceRef = doc(db, 'billing', String(id));
            await updateDoc(invoiceRef, JSON.parse(JSON.stringify(updatedData)));
        } catch (err) {
            console.error("Update invoice error:", err);
            throw err;
        }
    };

    const deleteInvoice = async (id) => {
        try {
            const invoiceRef = doc(db, 'billing', String(id));
            await runTransaction(db, async (transaction) => {
                const invSnap = await transaction.get(invoiceRef);
                if (!invSnap.exists()) {
                    throw new Error("BILL_NOT_FOUND: The invoice with ID " + id + " was not found in database.");
                }
                const invData = invSnap.data();

                // Restore Stock
                if (invData.items && Array.isArray(invData.items)) {
                    for (const item of invData.items) {
                        if (item.type === 'product' && item.id) {
                            const productRef = doc(db, 'inventory', String(item.id));
                            transaction.update(productRef, { stock: increment(item.quantity || 0) });
                        }
                    }
                }

                transaction.update(invoiceRef, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString(),
                    deletedBy: user?.uid || 'unknown'
                });
            });
        } catch (err) {
            console.error("Delete invoice error:", err);
            throw err;
        }
    };

    const restoreInvoice = async (id) => {
        try {
            const invoiceRef = doc(db, 'billing', String(id));
            await runTransaction(db, async (transaction) => {
                const invSnap = await transaction.get(invoiceRef);
                if (!invSnap.exists()) {
                    throw new Error("BILL_NOT_FOUND: The invoice with ID " + id + " was not found in database.");
                }
                const invData = invSnap.data();

                // Deduct Stock
                if (invData.items && Array.isArray(invData.items)) {
                    for (const item of invData.items) {
                        if (item.type === 'product' && item.id) {
                            const productRef = doc(db, 'inventory', String(item.id));
                            transaction.update(productRef, { stock: increment(-(item.quantity || 0)) });
                        }
                    }
                }

                transaction.update(invoiceRef, {
                    isDeleted: false,
                    restoredAt: new Date().toISOString(),
                    restoredBy: user?.uid || 'unknown'
                });
            });
        } catch (err) {
            console.error("Restore invoice error:", err);
            throw err;
        }
    };

    const permanentlyDeleteInvoice = async (id) => {
        try {
            await deleteDoc(doc(db, 'billing', String(id)));
        } catch (err) {
            console.error("Permanent delete error:", err);
            throw err;
        }
    };

    const getCustomerHistory = (idOrPhone) => {
        return invoices.filter(inv =>
            inv.customer?.phone === idOrPhone ||
            inv.customer?.name === idOrPhone ||
            inv.id === idOrPhone
        );
    };

    const getPendingPayments = () => {
        return invoices.filter(inv => !inv.isClosed && (inv.paymentStatus === 'pending' || inv.paymentStatus === 'partially_paid'));
    };

    const updateCustomerInfo = async (identifier, newInfo) => {
        const customerInvoices = getCustomerHistory(identifier);
        const updatePromises = customerInvoices.map(inv => {
            const updatedCustomer = { ...inv.customer, ...newInfo };
            return updateInvoice(inv.id, { customer: updatedCustomer });
        });
        await Promise.all(updatePromises);
    };

    return (
        <InvoiceContext.Provider value={{
            invoices,
            deletedInvoices,
            loading,
            error,
            addInvoice,
            updateInvoice,
            deleteInvoice,
            restoreInvoice,
            permanentlyDeleteInvoice,
            getCustomerHistory,
            getPendingPayments,
            updateCustomerInfo
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
