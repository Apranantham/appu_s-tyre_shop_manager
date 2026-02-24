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
    orderBy,
    runTransaction,
    increment
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
                where('createdBy', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allInvoices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setInvoices(allInvoices.filter(inv => !inv.isDeleted));
            setDeletedInvoices(allInvoices.filter(inv => inv.isDeleted));
            setLoading(false);
        }, (err) => {
            console.error("Invoice listener error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addInvoice = async (invoice) => {
        if (!user) throw new Error("Authentication required to create invoice");
        try {
            const plainInvoice = JSON.parse(JSON.stringify(invoice));
            const settingsRef = doc(db, 'settings', 'shopProfile');
            const billingCollection = collection(db, 'billing');

            const invoiceId = await runTransaction(db, async (transaction) => {
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
                    isDeleted: false // Ensure new invoices are not marked as deleted
                });

                transaction.set(settingsRef, {
                    nextInvoiceNumber: nextNo + 1
                }, { merge: true });

                return newInvoiceRef.id;
            });

            return invoiceId;
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
            const invoiceRef = doc(db, 'billing', String(id));

            await runTransaction(db, async (transaction) => {
                const invSnap = await transaction.get(invoiceRef);
                if (!invSnap.exists()) return;

                const invData = invSnap.data();

                // Restore Stock
                if (invData.items && Array.isArray(invData.items)) {
                    for (const item of invData.items) {
                        if (item.type === 'product' && item.id) {
                            const productRef = doc(db, 'inventory', String(item.id));
                            transaction.update(productRef, {
                                stock: increment(item.quantity || 0)
                            });
                        }
                    }
                }

                // Soft Delete
                transaction.update(invoiceRef, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString(),
                    deletedBy: user?.uid || 'unknown'
                });
            });
        } catch (error) {
            console.error("Error trashing invoice:", error);
            throw error;
        }
    };

    const restoreInvoice = async (id) => {
        try {
            const invoiceRef = doc(db, 'billing', String(id));

            await runTransaction(db, async (transaction) => {
                const invSnap = await transaction.get(invoiceRef);
                if (!invSnap.exists()) return;

                const invData = invSnap.data();

                // Deduct Stock again (must check availability first in a real scenario, 
                // but for simplicity here we just decrement)
                if (invData.items && Array.isArray(invData.items)) {
                    for (const item of invData.items) {
                        if (item.type === 'product' && item.id) {
                            const productRef = doc(db, 'inventory', String(item.id));
                            transaction.update(productRef, {
                                stock: increment(-(item.quantity || 0))
                            });
                        }
                    }
                }

                // Restore
                transaction.update(invoiceRef, {
                    isDeleted: false,
                    restoredAt: new Date().toISOString(),
                    restoredBy: user?.uid || 'unknown'
                });
            });
        } catch (error) {
            console.error("Error restoring invoice:", error);
            throw error;
        }
    };

    const permanentlyDeleteInvoice = async (id) => {
        try {
            await deleteDoc(doc(db, 'billing', String(id)));
        } catch (error) {
            console.error("Error permanently deleting invoice:", error);
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

    const getPendingPayments = () => {
        return invoices.filter(inv => !inv.isClosed && (inv.paymentStatus === 'pending' || inv.paymentStatus === 'partially_paid'));
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
