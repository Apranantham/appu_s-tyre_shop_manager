import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Banknote,
    CreditCard,
    QrCode,
    Wallet,
    ChevronLeft,
    ChevronRight,
    ReceiptText,
    TrendingUp,
    Clock,
    Share2,
    BookOpen
} from 'lucide-react';
import { useInvoices } from '../../context/InvoiceContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn';
import Loader from '../../components/ui/Loader';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const toInputDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Flatten every payment across invoices, synthesizing the initial payment when
// paidAmount exceeds the recorded payments — same convention the dashboard and
// sales chart use, so all three screens agree on revenue.
const flattenPayments = (invoices) => {
    const rows = [];
    invoices.forEach(inv => {
        const recorded = inv.payments || [];
        const recordedTotal = recorded.reduce((s, p) => s + (p.amount || 0), 0);
        if ((inv.paidAmount || 0) > recordedTotal) {
            rows.push({
                amount: inv.paidAmount - recordedTotal,
                date: inv.date,
                mode: inv.paymentMode || 'cash',
                inv
            });
        }
        recorded.forEach(p => {
            if (!p.amount || !p.date) return;
            rows.push({ ...p, mode: p.mode || inv.paymentMode || 'cash', inv });
        });
    });
    return rows;
};

const MODE_META = {
    cash: { icon: Banknote, color: 'text-[var(--color-success)]', soft: 'bg-[var(--color-success-soft)]' },
    upi: { icon: QrCode, color: 'text-[var(--color-primary)]', soft: 'bg-[var(--color-primary-soft)]' },
    card: { icon: CreditCard, color: 'text-[var(--color-secondary)]', soft: 'bg-[var(--color-secondary-soft)]' },
};

const DayBookPage = () => {
    const navigate = useNavigate();
    const { invoices, loading: invoicesLoading } = useInvoices();
    const { expenses } = useExpenses();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const dayStr = selectedDate.toDateString();
    const isToday = dayStr === new Date().toDateString();

    const shiftDay = (delta) => {
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + delta);
            return d;
        });
    };

    const report = useMemo(() => {
        const dayPayments = flattenPayments(invoices)
            .filter(p => new Date(p.date).toDateString() === dayStr)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const byMode = { cash: 0, card: 0, upi: 0 };
        let fromNewBills = 0;
        let duesCollected = 0;
        dayPayments.forEach(p => {
            const mode = byMode[p.mode] !== undefined ? p.mode : 'cash';
            byMode[mode] += p.amount;
            if (new Date(p.inv.date).toDateString() === dayStr) fromNewBills += p.amount;
            else duesCollected += p.amount;
        });
        const totalCollected = byMode.cash + byMode.card + byMode.upi;

        const dayExpenses = expenses.filter(e => new Date(e.date).toDateString() === dayStr);
        const expenseByMode = { cash: 0, card: 0, upi: 0 };
        dayExpenses.forEach(e => {
            const mode = expenseByMode[e.paymentMode] !== undefined ? e.paymentMode : 'cash';
            expenseByMode[mode] += (e.amount || 0);
        });
        const totalExpenses = expenseByMode.cash + expenseByMode.card + expenseByMode.upi;

        const dayInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === dayStr);
        const totalBilled = dayInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
        const newPending = dayInvoices.reduce((s, inv) => s + (inv.balanceAmount || 0), 0);

        return {
            dayPayments,
            byMode,
            totalCollected,
            fromNewBills,
            duesCollected,
            expenseByMode,
            totalExpenses,
            netCash: byMode.cash - expenseByMode.cash,
            billCount: dayInvoices.length,
            totalBilled,
            newPending
        };
    }, [invoices, expenses, dayStr]);

    const shareSummary = () => {
        const dateLabel = selectedDate.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const line = '--------------------------';
        const msg =
            `${(shopDetails?.shopName || 'TYRE SHOP').toUpperCase()}
${t.day_book} — ${dateLabel}
${line}
${t.total_collected}: ${fmt(report.totalCollected)}
  ${t.cash}: ${fmt(report.byMode.cash)}
  UPI: ${fmt(report.byMode.upi)}
  ${t.card}: ${fmt(report.byMode.card)}
${line}
${t.from_new_bills}: ${fmt(report.fromNewBills)}
${t.dues_collected}: ${fmt(report.duesCollected)}
${t.bills_created}: ${report.billCount} (${t.total_billed}: ${fmt(report.totalBilled)})
${t.new_pending}: ${fmt(report.newPending)}
${line}
${t.expenses_paid}: ${fmt(report.totalExpenses)}
${t.net_cash}: ${fmt(report.netCash)}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (invoicesLoading) return <Loader />;

    const modeRows = [
        { id: 'cash', label: t.cash },
        { id: 'upi', label: t.upi },
        { id: 'card', label: t.card },
    ];

    return (
        <div className="space-y-6 pb-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <BookOpen className="h-6 w-6 text-[var(--color-primary)]" />
                        {t.day_book}
                    </h1>
                    <p className="text-[var(--color-text-gray)] text-sm">{t.closing_summary}</p>
                </div>

                {/* Date navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => shiftDay(-1)}
                        className="h-10 w-10 flex items-center justify-center rounded-control bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors"
                        aria-label="Previous day"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <input
                        type="date"
                        value={toInputDate(selectedDate)}
                        max={toInputDate(new Date())}
                        onChange={(e) => e.target.value && setSelectedDate(new Date(`${e.target.value}T12:00:00`))}
                        className="h-10 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-control px-3 text-sm font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                    <button
                        onClick={() => shiftDay(1)}
                        disabled={isToday}
                        className="h-10 w-10 flex items-center justify-center rounded-control bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Next day"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                        onClick={shareSummary}
                        className="h-10 px-4 flex items-center gap-2 rounded-control bg-[#25D366] text-white text-xs font-bold uppercase tracking-wide active:scale-95 transition-transform"
                    >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.share_summary}</span>
                    </button>
                </div>
            </div>

            {/* Collection tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-panel bg-[var(--color-primary)] text-white col-span-2 lg:col-span-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{t.total_collected}</p>
                    <p className="text-3xl font-black mt-2 tracking-tight">{fmt(report.totalCollected)}</p>
                    <p className="text-[11px] font-semibold mt-2 opacity-80 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {report.dayPayments.length} {t.payments_received.toLowerCase()}
                    </p>
                </div>
                {modeRows.map(({ id, label }) => {
                    const Meta = MODE_META[id];
                    return (
                        <div key={id} className="p-5 rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className={cn("h-9 w-9 rounded-control flex items-center justify-center mb-3", Meta.soft, Meta.color)}>
                                <Meta.icon className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-gray)]">{label}</p>
                            <p className="text-2xl font-black mt-1 text-[var(--color-text)] tracking-tight">{fmt(report.byMode[id])}</p>
                        </div>
                    );
                })}
            </div>

            {/* Breakdown row */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Sales & dues */}
                <div className="p-6 rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)] space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)] flex items-center gap-2">
                        <ReceiptText className="h-4 w-4" /> {t.billing}
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-gray)] font-semibold">{t.bills_created}</span>
                            <span className="font-black text-[var(--color-text)]">{report.billCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-gray)] font-semibold">{t.total_billed}</span>
                            <span className="font-black text-[var(--color-text)]">{fmt(report.totalBilled)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-gray)] font-semibold">{t.from_new_bills}</span>
                            <span className="font-black text-[var(--color-success)]">{fmt(report.fromNewBills)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-gray)] font-semibold">{t.dues_collected}</span>
                            <span className="font-black text-[var(--color-success)]">{fmt(report.duesCollected)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
                            <span className="text-[var(--color-text-gray)] font-semibold flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-[var(--color-warning)]" /> {t.new_pending}
                            </span>
                            <span className="font-black text-[var(--color-warning)]">{fmt(report.newPending)}</span>
                        </div>
                    </div>
                </div>

                {/* Expenses & net cash */}
                <div className="p-6 rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)] space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)] flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> {t.expenses_paid}
                    </h3>
                    <div className="space-y-3 text-sm">
                        {modeRows.map(({ id, label }) => (
                            <div key={id} className="flex justify-between items-center">
                                <span className="text-[var(--color-text-gray)] font-semibold">{label}</span>
                                <span className={cn(
                                    "font-black",
                                    report.expenseByMode[id] > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-text-gray)]/50"
                                )}>
                                    {report.expenseByMode[id] > 0 ? `-${fmt(report.expenseByMode[id])}` : fmt(0)}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
                            <span className="text-[var(--color-text-gray)] font-semibold">{t.expenses}</span>
                            <span className="font-black text-[var(--color-danger)]">-{fmt(report.totalExpenses)}</span>
                        </div>
                    </div>
                    {/* Net cash strip */}
                    <div className={cn(
                        "mt-2 p-4 rounded-card flex justify-between items-center",
                        report.netCash >= 0 ? "bg-[var(--color-success-soft)]" : "bg-[var(--color-danger-soft)]"
                    )}>
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">{t.net_cash}</span>
                        <span className={cn(
                            "text-2xl font-black tracking-tight",
                            report.netCash >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                        )}>
                            {fmt(report.netCash)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payments received list */}
            <div className="rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)]">
                        {t.payments_received} ({report.dayPayments.length})
                    </h3>
                </div>
                {report.dayPayments.length === 0 ? (
                    <div className="py-12 text-center text-[var(--color-text-gray)]/60 text-sm font-semibold">
                        {t.no_activity}
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-border)]/50">
                        {report.dayPayments.map((p, idx) => {
                            const Meta = MODE_META[MODE_META[p.mode] ? p.mode : 'cash'];
                            const isDue = new Date(p.inv.date).toDateString() !== dayStr;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => navigate('/history')}
                                    className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-[var(--color-bg-dark)]/40 transition-colors text-left"
                                >
                                    <div className={cn("h-9 w-9 shrink-0 rounded-control flex items-center justify-center", Meta.soft, Meta.color)}>
                                        <Meta.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-[var(--color-text)] truncate">
                                            {p.inv.customer?.name || '—'}
                                            <span className="text-[var(--color-text-gray)] font-semibold ml-2 text-xs">
                                                #{p.inv.invoiceNo || p.inv.id}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[var(--color-text-gray)] font-semibold">
                                            {new Date(p.date).toLocaleTimeString(lang === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })}
                                            {isDue && (
                                                <span className="ml-2 px-2 py-0.5 rounded-pill bg-[var(--color-warning-soft)] text-[var(--color-warning)] text-[10px] font-black uppercase">
                                                    {t.dues_collected}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <span className="font-black text-[var(--color-success)] shrink-0">+{fmt(p.amount)}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DayBookPage;
