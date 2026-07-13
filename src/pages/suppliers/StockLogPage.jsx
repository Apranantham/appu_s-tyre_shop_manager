import React, { useMemo, useState } from 'react';
import { ScrollText, Search, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn';

// reason → label (en/ta) + tone
const REASONS = {
    sale: { en: 'Sale', ta: 'விற்பனை', tone: 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' },
    sale_edit: { en: 'Bill edited', ta: 'பில் திருத்தம்', tone: 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' },
    sale_void: { en: 'Bill voided', ta: 'பில் ரத்து', tone: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]' },
    sale_restore: { en: 'Bill restored', ta: 'பில் மீட்பு', tone: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]' },
    purchase: { en: 'Stock received', ta: 'சரக்கு வரவு', tone: 'text-[var(--color-success)] bg-[var(--color-success-soft)]' },
    adjustment: { en: 'Adjustment', ta: 'சரிசெய்தல்', tone: 'text-[var(--color-text-gray)] bg-[var(--color-bg-dark)]' },
};

const StockLogPage = () => {
    const { movements } = useProcurement();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const ta = lang === 'ta';

    const [search, setSearch] = useState('');

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return movements;
        return movements.filter(m =>
            (m.productName || '').toLowerCase().includes(q)
            || (m.note || '').toLowerCase().includes(q)
            || (m.refId || '').toLowerCase().includes(q)
        );
    }, [movements, search]);

    // Group by day for scannability.
    const grouped = useMemo(() => {
        const map = new Map();
        visible.forEach(m => {
            const key = new Date(m.createdAt).toDateString();
            (map.get(key) || map.set(key, []).get(key)).push(m);
        });
        return Array.from(map.entries());
    }, [visible]);

    return (
        <div className="space-y-6 pb-10 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                    <ScrollText className="h-6 w-6 text-[var(--color-primary)]" />
                    {t.stock_log || 'Stock Log'}
                </h1>
                <p className="text-[var(--color-text-gray)] text-sm">
                    {ta ? 'ஒவ்வொரு இருப்பு மாற்றமும் — யார், எப்போது, ஏன்' : 'Every stock change — who, when, and why'}
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={ta ? 'பொருள் / குறிப்பு தேடு...' : 'Search product / note...'}
                    className="w-full h-12 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-card pl-11 pr-4 text-sm font-semibold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
            </div>

            {grouped.length === 0 ? (
                <div className="py-16 text-center rounded-panel bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border)]">
                    <ScrollText className="h-12 w-12 mx-auto mb-3 text-[var(--color-text-gray)] opacity-20" />
                    <p className="text-sm font-bold text-[var(--color-text-gray)]">
                        {ta ? 'பதிவுகள் இல்லை — விற்பனை/வரவுகள் தானாக இங்கு பதிவாகும்' : 'No movements yet — sales and stock receipts log here automatically'}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {grouped.map(([day, rows]) => (
                        <div key={day}>
                            <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-gray)] mb-2 px-1">
                                {new Date(day).toLocaleDateString(ta ? 'ta-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
                            </p>
                            <div className="rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]/50 overflow-hidden">
                                {rows.map(m => {
                                    const meta = REASONS[m.reason] || REASONS.adjustment;
                                    const positive = (m.delta || 0) > 0;
                                    return (
                                        <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                                            <div className={cn(
                                                "h-9 w-9 shrink-0 rounded-control flex items-center justify-center",
                                                positive ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                                            )}>
                                                {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-[var(--color-text)] truncate">
                                                    {m.productName || m.productId}
                                                    {m.refId && <span className="text-[var(--color-text-gray)] font-semibold text-xs ml-2">#{m.refId}</span>}
                                                </p>
                                                <p className="text-[11px] text-[var(--color-text-gray)] font-semibold truncate">
                                                    {new Date(m.createdAt).toLocaleTimeString(ta ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })}
                                                    {m.creatorName || m.creatorEmail ? ` · ${m.creatorName || m.creatorEmail}` : ''}
                                                    {m.note ? ` · ${m.note}` : ''}
                                                </p>
                                            </div>
                                            <span className={cn("px-2.5 py-1 rounded-pill text-[10px] font-black uppercase tracking-wide shrink-0", meta.tone)}>
                                                {ta ? meta.ta : meta.en}
                                            </span>
                                            <span className={cn(
                                                "font-black text-base shrink-0 w-14 text-right tabular-nums",
                                                positive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                                            )}>
                                                {positive ? '+' : ''}{m.delta}
                                            </span>
                                        </div>
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

export default StockLogPage;
