import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Append entries to the immutable stock-movement audit trail.
 * Fire-and-forget: a logging failure must never block a sale, so errors are
 * reported to the console but not rethrown.
 *
 * entry: { productId, productName, delta, reason, refId?, note? }
 *   delta  — signed change to stock (+ receipt/return, − sale/deduction)
 *   reason — 'sale' | 'sale_edit' | 'sale_void' | 'sale_restore' | 'purchase' | 'adjustment'
 */
export const logStockMovements = (entries, user) => {
    const stamped = (Array.isArray(entries) ? entries : [entries])
        .filter(e => e && e.delta !== 0);
    stamped.forEach(e => {
        addDoc(collection(db, 'stock_movements'), {
            productId: String(e.productId ?? ''),
            productName: e.productName || '',
            delta: Number(e.delta) || 0,
            reason: e.reason || 'adjustment',
            refId: e.refId != null ? String(e.refId) : null,
            note: e.note || '',
            createdBy: user?.uid || 'unknown',
            creatorEmail: user?.email || '',
            creatorName: user?.name || '',
            createdAt: new Date().toISOString(),
        }).catch(err => console.error('Stock log write failed:', err));
    });
};
