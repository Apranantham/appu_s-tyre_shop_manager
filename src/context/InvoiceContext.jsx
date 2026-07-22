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
    updateDoc,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { logStockMovements } from '../utils/stockLog';
import { isStockTracked } from '../utils/stock';

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
        const plainInvoice = JSON.parse(JSON.stringify(invoice));
        const settingsRef = doc(db, 'settings', 'shopProfile');
        const billingCollection = collection(db, 'billing');
        const stamp = {
            createdBy: user.uid,
            creatorEmail: user.email,
            creatorName: user.name,
            createdAt: new Date().toISOString(),
            isDeleted: false
        };

        try {
            // Preferred path: atomic numbering. Transactions need the server.
            return await runTransaction(db, async (transaction) => {
                const settingsSnap = await transaction.get(settingsRef);
                let nextNo = 101;
                if (settingsSnap.exists()) {
                    nextNo = settingsSnap.data().nextInvoiceNumber || 101;
                }

                const newInvoiceRef = doc(billingCollection);
                transaction.set(newInvoiceRef, { ...plainInvoice, invoiceNo: nextNo, ...stamp });
                transaction.set(settingsRef, { nextInvoiceNumber: nextNo + 1 }, { merge: true });

                return { id: newInvoiceRef.id, invoiceNo: nextNo };
            });
        } catch (err) {
            // Offline (or transient) fallback: transactions fail without a
            // connection even though the local cache can queue plain writes.
            // Number from the cached counter and queue the writes — they sync
            // when the connection returns, so the shop can keep billing.
            console.warn("Invoice transaction failed, falling back to offline numbering:", err);
            let nextNo = 101;
            try {
                const cached = await getDoc(settingsRef); // served from cache when offline
                if (cached.exists()) nextNo = cached.data().nextInvoiceNumber || 101;
            } catch { /* no cached settings — keep the default */ }

            const newInvoiceRef = doc(billingCollection);
            // Deliberately NOT awaited: offline write promises only resolve on
            // server ack. The writes are queued durably in IndexedDB.
            setDoc(newInvoiceRef, { ...plainInvoice, invoiceNo: nextNo, ...stamp, offlineNumbered: true })
                .catch(e => console.error("Queued invoice write failed:", e));
            setDoc(settingsRef, { nextInvoiceNumber: increment(1) }, { merge: true })
                .catch(e => console.error("Queued counter bump failed:", e));

            return { id: newInvoiceRef.id, invoiceNo: nextNo };
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
            let deletedData = null;
            await runTransaction(db, async (transaction) => {
                const invSnap = await transaction.get(invoiceRef);
                if (!invSnap.exists()) {
                    throw new Error("BILL_NOT_FOUND: The invoice with ID " + id + " was not found in database.");
                }
                const invData = invSnap.data();

                // Restore Stock (only for tracked products; untracked have no
                // stock number to move).
                if (invData.items && Array.isArray(invData.items)) {
                    for (const item of invData.items) {
                        if (item.type === 'product' && item.id && isStockTracked(item)) {
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

                deletedData = invData;
            });

            // Audit AFTER commit (transactions may retry — logging inside would duplicate).
            if (deletedData) {
                logStockMovements(
                    (deletedData.items || [])
                        .filter(it => it.type === 'product' && it.id && isStockTracked(it))
                        .map(it => ({
                            productId: it.id,
                            productName: it.name,
                            delta: it.quantity || 0,
                            reason: 'sale_void',
                            refId: deletedData.invoiceNo || id
                        })),
                    user
                );
            }
        } catch (err) {
            console.error("Delete invoice error:", err);
            throw err;
        }
    };

    const restoreInvoice = async (id) => {
        try {
            const invoiceRef = doc(db, 'billing', String(id));
            let restoredData = null;
            await runTransaction(db, async (transaction) => {
                const invSnap = await transaction.get(invoiceRef);
                if (!invSnap.exists()) {
                    throw new Error("BILL_NOT_FOUND: The invoice with ID " + id + " was not found in database.");
                }
                const invData = invSnap.data();

                // Deduct Stock (tracked products only).
                if (invData.items && Array.isArray(invData.items)) {
                    for (const item of invData.items) {
                        if (item.type === 'product' && item.id && isStockTracked(item)) {
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

                restoredData = invData;
            });

            // Audit AFTER commit (transactions may retry — logging inside would duplicate).
            if (restoredData) {
                logStockMovements(
                    (restoredData.items || [])
                        .filter(it => it.type === 'product' && it.id && isStockTracked(it))
                        .map(it => ({
                            productId: it.id,
                            productName: it.name,
                            delta: -(it.quantity || 0),
                            reason: 'sale_restore',
                            refId: restoredData.invoiceNo || id
                        })),
                    user
                );
            }
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
        // allSettled (not all): one failed write must not hide that the rest
        // succeeded. Report how many failed so the caller can warn the user
        // instead of silently leaving the customer half-renamed across bills.
        const results = await Promise.allSettled(
            customerInvoices.map(inv =>
                updateInvoice(inv.id, { customer: { ...inv.customer, ...newInfo } })
            )
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            throw new Error(`${failed} of ${customerInvoices.length} records could not be updated`);
        }
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
