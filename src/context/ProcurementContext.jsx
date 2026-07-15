import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    runTransaction,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { logStockMovements } from '../utils/stockLog';

const ProcurementContext = createContext();

/**
 * Suppliers + stock purchases (goods receipt) + the stock-movement audit trail.
 *
 * A purchase: { supplierId, supplierName, date, items:[{productId, name, qty, unitCost}],
 *   total, paidAmount, balanceAmount, status: 'paid'|'pending'|'partially_paid',
 *   payments:[{amount, mode, date}], createdBy/creatorEmail/creatorName, createdAt }
 *
 * Receiving a purchase increments product stock, refreshes each product's
 * costPrice to the latest unit cost, logs stock movements, and records the
 * paid portion as a `stock_purchase` expense so the Day Book's cash stays true.
 */
export const ProcurementProvider = ({ children }) => {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setSuppliers([]); setPurchases([]); setMovements([]); setLoading(false);
            return;
        }
        const unsubs = [
            onSnapshot(query(collection(db, 'suppliers'), orderBy('name')), (snap) => {
                setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Suppliers listener error:', err)),
            onSnapshot(collection(db, 'purchases'), (snap) => {
                const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                rows.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPurchases(rows);
                setLoading(false);
            }, (err) => { console.error('Purchases listener error:', err); setLoading(false); }),
            // Most recent 300 movements are enough for the on-screen log.
            onSnapshot(query(collection(db, 'stock_movements'), orderBy('createdAt', 'desc'), limit(300)), (snap) => {
                setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Stock log listener error:', err)),
        ];
        return () => unsubs.forEach(u => u());
    }, [user]);

    const stamp = () => ({
        createdBy: user?.uid || 'unknown',
        creatorEmail: user?.email || '',
        creatorName: user?.name || '',
        createdAt: new Date().toISOString(),
    });

    // ---- Suppliers ----
    const addSupplier = (data) => addDoc(collection(db, 'suppliers'), { ...data, ...stamp() });
    const updateSupplier = (id, data) => updateDoc(doc(db, 'suppliers', id), data);
    const deleteSupplier = (id) => deleteDoc(doc(db, 'suppliers', id));

    // Records the money-out side of a supplier payment in the expenses book.
    const recordPurchaseExpense = (supplierName, amount, mode, dateISO) => {
        if (!amount || amount <= 0) return;
        addDoc(collection(db, 'expenses'), {
            category: 'stock_purchase',
            customCategory: '',
            description: `Stock purchase — ${supplierName}`,
            amount,
            paymentMode: mode || 'cash',
            date: dateISO || new Date().toISOString(),
            ...stamp()
        }).catch(err => console.error('Auto-expense write failed:', err));
    };

    // ---- Goods receipt ----
    const addPurchase = async ({ supplier, date, items, paidAmount, paymentMode }) => {
        const cleanItems = (items || []).filter(it => it.productId && (Number(it.qty) || 0) > 0);
        if (cleanItems.length === 0) throw new Error('NO_ITEMS');
        const total = cleanItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitCost) || 0), 0);
        const paid = Math.min(Math.max(0, Number(paidAmount) || 0), total);
        const status = paid >= total ? 'paid' : (paid > 0 ? 'partially_paid' : 'pending');
        const dateISO = date || new Date().toISOString();

        // Record the purchase FIRST, then move stock. If the stock transaction
        // fails, the purchase doc is removed again — so a partial failure can
        // never leave stock inflated with no purchase record (or vice versa).
        const purchaseDoc = await addDoc(collection(db, 'purchases'), {
            supplierId: supplier?.id || null,
            supplierName: supplier?.name || '',
            date: dateISO,
            items: cleanItems.map(it => ({
                productId: String(it.productId),
                name: it.name || '',
                qty: Number(it.qty) || 0,
                unitCost: Number(it.unitCost) || 0
            })),
            total,
            paidAmount: paid,
            balanceAmount: total - paid,
            status,
            payments: paid > 0 ? [{ amount: paid, mode: paymentMode || 'cash', date: dateISO }] : [],
            ...stamp()
        });

        try {
            // Stock + cost updates in one transaction so a failure changes nothing.
            await runTransaction(db, async (transaction) => {
                for (const it of cleanItems) {
                    const ref = doc(db, 'inventory', String(it.productId));
                    const update = { stock: increment(Number(it.qty) || 0) };
                    if ((Number(it.unitCost) || 0) > 0) update.costPrice = Number(it.unitCost);
                    transaction.update(ref, update);
                }
            });
        } catch (err) {
            // Compensate: withdraw the purchase record so nothing half-applies.
            await deleteDoc(doc(db, 'purchases', purchaseDoc.id)).catch(() => { });
            throw err;
        }

        logStockMovements(cleanItems.map(it => ({
            productId: it.productId,
            productName: it.name,
            delta: Number(it.qty) || 0,
            reason: 'purchase',
            refId: purchaseDoc.id,
            note: supplier?.name || ''
        })), user);

        recordPurchaseExpense(supplier?.name || 'Supplier', paid, paymentMode, dateISO);
        return purchaseDoc.id;
    };

    // ---- Supplier payment against an open purchase ----
    const settlePurchase = async (purchase, amount, mode) => {
        const pay = Math.min(Math.max(0, Number(amount) || 0), purchase.balanceAmount || 0);
        if (pay <= 0) return;
        const newPaid = (purchase.paidAmount || 0) + pay;
        const newBalance = (purchase.total || 0) - newPaid;
        const nowISO = new Date().toISOString();
        await updateDoc(doc(db, 'purchases', purchase.id), {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newBalance <= 0 ? 'paid' : 'partially_paid',
            payments: [...(purchase.payments || []), { amount: pay, mode: mode || 'cash', date: nowISO }]
        });
        recordPurchaseExpense(purchase.supplierName || 'Supplier', pay, mode, nowISO);
    };

    // Outstanding payable per supplier id (plus name-keyed for legacy rows).
    const payables = useMemo(() => {
        const map = {};
        purchases.forEach(p => {
            const key = p.supplierId || p.supplierName || 'unknown';
            map[key] = (map[key] || 0) + (p.balanceAmount || 0);
        });
        return map;
    }, [purchases]);

    return (
        <ProcurementContext.Provider value={{
            suppliers, purchases, movements, loading, payables,
            addSupplier, updateSupplier, deleteSupplier,
            addPurchase, settlePurchase
        }}>
            {children}
        </ProcurementContext.Provider>
    );
};

export const useProcurement = () => {
    const ctx = useContext(ProcurementContext);
    if (ctx === undefined) throw new Error('useProcurement must be used within a ProcurementProvider');
    return ctx;
};
