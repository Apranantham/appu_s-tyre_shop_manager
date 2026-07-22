import { useMemo } from 'react';
import { useInvoices } from '../context/InvoiceContext';

// Derives per-item popularity from billing history — no schema change, no new
// writes. Returns a Map-like object keyed `${type}:${id}` → { count, lastUsed }.
// `count` = number of bills the item appears on (frequency, not total qty, so a
// staple sold one-at-a-time still ranks above a rare bulk sale). `lastUsed` =
// most recent invoice timestamp, for the "Recent" ordering.
export const useItemStats = () => {
    const { invoices } = useInvoices();
    return useMemo(() => {
        const map = {};
        (invoices || []).forEach((inv) => {
            const ts = new Date(inv.date).getTime() || 0;
            (inv.items || []).forEach((it) => {
                if (it.id == null || it.type === 'old_part') return;
                const key = `${it.type}:${it.id}`;
                if (!map[key]) map[key] = { count: 0, lastUsed: 0 };
                map[key].count += 1;
                if (ts > map[key].lastUsed) map[key].lastUsed = ts;
            });
        });
        return map;
    }, [invoices]);
};

// Rank helper: favorites first, then most-billed, then most-recent, then name.
export const rankItems = (items, type, stats, favorites) => {
    const stat = (it) => stats[`${type}:${it.id}`] || { count: 0, lastUsed: 0 };
    const isFav = (it) => favorites.has(`${type}:${it.id}`);
    return [...items].sort((a, b) => {
        const fa = isFav(a), fb = isFav(b);
        if (fa !== fb) return fa ? -1 : 1;
        const sa = stat(a), sb = stat(b);
        if (sb.count !== sa.count) return sb.count - sa.count;
        if (sb.lastUsed !== sa.lastUsed) return sb.lastUsed - sa.lastUsed;
        return (a.name || '').localeCompare(b.name || '');
    });
};
