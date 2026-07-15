import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HandCoins,
    Search,
    Phone,
    Car,
    Clock,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { useInvoices } from '../../context/InvoiceContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn';
import { formatMoney as fmt } from '../../utils/format';
import { openWhatsApp } from '../../utils/whatsapp';
import WhatsAppIcon from '../../components/ui/WhatsAppIcon';
import Loader from '../../components/ui/Loader';

const DAY_MS = 24 * 60 * 60 * 1000;

// Aging buckets, most urgent first for display priority.
const BUCKETS = [
    { id: '90+', label: '90+', min: 91, max: Infinity, color: 'text-[var(--color-danger)]', soft: 'bg-[var(--color-danger-soft)]', bar: 'bg-[var(--color-danger)]' },
    { id: '61-90', label: '61–90', min: 61, max: 90, color: 'text-[var(--color-secondary)]', soft: 'bg-[var(--color-secondary-soft)]', bar: 'bg-[var(--color-secondary)]' },
    { id: '31-60', label: '31–60', min: 31, max: 60, color: 'text-[var(--color-warning)]', soft: 'bg-[var(--color-warning-soft)]', bar: 'bg-[var(--color-warning)]' },
    { id: '0-30', label: '0–30', min: 0, max: 30, color: 'text-[var(--color-success)]', soft: 'bg-[var(--color-success-soft)]', bar: 'bg-[var(--color-success)]' },
];

const bucketFor = (days) => BUCKETS.find(b => days >= b.min && days <= b.max) || BUCKETS[3];

const DuesPage = () => {
    const navigate = useNavigate();
    const { invoices, loading } = useInvoices();
    const { isAdmin } = useAuth();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const [search, setSearch] = useState('');
    const [bucketFilter, setBucketFilter] = useState(null);

    const { customers, bucketTotals, totalDue } = useMemo(() => {
        const now = Date.now();
        const open = invoices.filter(inv =>
            !inv.isClosed &&
            (inv.paymentStatus === 'pending' || inv.paymentStatus === 'partially_paid') &&
            (inv.balanceAmount || 0) > 0
        );

        // Group by customer (phone first — names collide more easily).
        const map = new Map();
        open.forEach(inv => {
            const key = inv.customer?.phone || inv.customer?.name || inv.id;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: inv.customer?.name || '—',
                    phone: inv.customer?.phone || '',
                    vehicle: inv.customer?.vehicle || '',
                    due: 0,
                    oldestDays: 0,
                    bills: []
                });
            }
            const c = map.get(key);
            const days = Math.max(0, Math.floor((now - new Date(inv.date).getTime()) / DAY_MS));
            c.due += inv.balanceAmount || 0;
            c.oldestDays = Math.max(c.oldestDays, days);
            c.bills.push({
                id: inv.id,
                invoiceNo: inv.invoiceNo,
                date: inv.date,
                days,
                balance: inv.balanceAmount || 0
            });
        });

        const customers = Array.from(map.values())
            .map(c => ({ ...c, bucket: bucketFor(c.oldestDays) }))
            .sort((a, b) => b.oldestDays - a.oldestDays || b.due - a.due);

        const bucketTotals = Object.fromEntries(BUCKETS.map(b => [b.id, { amount: 0 }]));
        customers.forEach(c => {
            // Attribute each BILL to its own bucket so totals reflect real aging.
            c.bills.forEach(bill => {
                const b = bucketFor(bill.days);
                bucketTotals[b.id].amount += bill.balance;
            });
        });

        const totalDue = customers.reduce((s, c) => s + c.due, 0);
        return { customers, bucketTotals, totalDue };
    }, [invoices]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return customers.filter(c => {
            // Match customers with ANY bill in the selected bucket, so a tile's
            // amount is always accounted for by the customers it lists.
            if (bucketFilter && !c.bills.some(b => bucketFor(b.days).id === bucketFilter)) return false;
            if (!q) return true;
            return c.name.toLowerCase().includes(q)
                || c.phone.includes(q)
                || c.vehicle.toLowerCase().includes(q);
        });
    }, [customers, search, bucketFilter]);

    const sendReminder = (c) => {
        const shopName = shopDetails?.shopName || 'Tyre Shop';
        const line = '--------------------------';
        const billLines = c.bills
            .map(b => `#${b.invoiceNo || b.id} (${new Date(b.date).toLocaleDateString('en-IN')}): ${fmt(b.balance)}`)
            .join('\n');
        const msg = lang === 'ta'
            ? `வணக்கம் ${c.name},\n\n${shopName} — நிலுவைத் தொகை நினைவூட்டல்:\n${line}\n${billLines}\n${line}\n${t.total_due}: ${fmt(c.due)}\n\nவசதியான நேரத்தில் செலுத்தவும். நன்றி!`
            : `Hello ${c.name},\n\nA gentle reminder from ${shopName} about your pending balance:\n${line}\n${billLines}\n${line}\n${t.total_due}: ${fmt(c.due)}\n\nKindly pay at your convenience. Thank you!`;

        openWhatsApp(c.phone, msg);
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 pb-10 max-w-5xl mx-auto">
            {!isAdmin && (
                <div className="p-3 rounded-card bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/30 text-[12px] font-bold text-[var(--color-warning)]">
                    {lang === 'ta'
                        ? 'நீங்கள் உருவாக்கிய பில்களின் நிலுவை மட்டுமே இங்கு காட்டப்படுகிறது.'
                        : 'Showing dues only from bills you created — not shop-wide receivables.'}
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <HandCoins className="h-6 w-6 text-[var(--color-primary)]" />
                        {t.dues}
                    </h1>
                    <p className="text-[var(--color-text-gray)] text-sm">{t.receivables_desc}</p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-gray)]">{t.total_due}</p>
                    <p className="text-3xl font-black tracking-tight text-[var(--color-warning)]">{fmt(totalDue)}</p>
                    <p className="text-[11px] font-semibold text-[var(--color-text-gray)]">
                        {customers.length} {t.customers_with_dues}
                    </p>
                </div>
            </div>

            {/* Aging buckets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...BUCKETS].reverse().map(b => {
                    const active = bucketFilter === b.id;
                    return (
                        <button
                            key={b.id}
                            onClick={() => setBucketFilter(active ? null : b.id)}
                            className={cn(
                                "p-4 rounded-panel border text-left transition-all relative overflow-hidden",
                                active
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                                    : "border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-text-gray)]/40"
                            )}
                        >
                            <span className={cn("absolute left-0 top-0 bottom-0 w-1", b.bar)} />
                            <p className={cn("text-[11px] font-black uppercase tracking-wider", b.color)}>
                                {b.label} {t.days_old}
                            </p>
                            <p className="text-xl font-black mt-1 text-[var(--color-text)] tracking-tight">
                                {fmt(bucketTotals[b.id].amount)}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.search_customer}
                    className="w-full h-12 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-card pl-11 pr-4 text-sm font-semibold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
            </div>

            {/* Customer list */}
            {visible.length === 0 ? (
                <div className="py-16 text-center rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-[var(--color-success)] mb-3" />
                    <p className="text-sm font-bold text-[var(--color-text-gray)]">{t.no_dues}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map(c => (
                        <div
                            key={c.key}
                            className="rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)] p-5 relative overflow-hidden"
                        >
                            <span className={cn("absolute left-0 top-0 bottom-0 w-1", c.bucket.bar)} />
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Identity */}
                                <button
                                    onClick={() => navigate(`/customers/${encodeURIComponent(c.phone || c.name)}`)}
                                    className="flex-1 min-w-0 text-left group"
                                >
                                    <p className="font-black text-base text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5">
                                        {c.name}
                                        <ChevronRight className="h-4 w-4 opacity-40" />
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12px] font-semibold text-[var(--color-text-gray)]">
                                        {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                                        {c.vehicle && <span className="flex items-center gap-1 uppercase"><Car className="h-3 w-3" />{c.vehicle}</span>}
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {c.bills.length} {t.pending_bills}
                                        </span>
                                    </div>
                                </button>

                                {/* Numbers + action */}
                                <div className="flex items-center gap-4 justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-xl font-black text-[var(--color-warning)] tracking-tight">{fmt(c.due)}</p>
                                        <p className={cn("text-[11px] font-black uppercase tracking-wider", c.bucket.color)}>
                                            {t.oldest_due}: {c.oldestDays} {t.days_old}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => sendReminder(c)}
                                        className="h-11 px-4 shrink-0 flex items-center gap-2 rounded-control bg-[#25D366] text-white text-[11px] font-black uppercase tracking-wide active:scale-95 transition-transform"
                                    >
                                        <WhatsAppIcon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t.send_reminder}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Bill chips */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {c.bills.map(b => {
                                    const bb = bucketFor(b.days);
                                    return (
                                        <span
                                            key={b.id}
                                            className={cn("px-2.5 py-1 rounded-pill text-[11px] font-bold", bb.soft, bb.color)}
                                        >
                                            #{b.invoiceNo || '—'} · {fmt(b.balance)} · {b.days}{lang === 'ta' ? ' நாள்' : 'd'}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DuesPage;
