import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useInvoices } from '../../context/InvoiceContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import WhatsAppIcon from '../../components/ui/WhatsAppIcon';
import InitialAvatar from '../../components/ui/InitialAvatar';
import { openWhatsApp } from '../../utils/whatsapp';
import { CustomerCardSkeleton } from '../../components/ui/SkeletonVariants';

const CustomerHistory = () => {
    const navigate = useNavigate();
    const { invoices, loading } = useInvoices();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const [searchTerm, setSearchTerm] = useState('');
    // Win-back filter: customers not seen for N+ months.
    const [followUpMonths, setFollowUpMonths] = useState(0);

    const sendWinBack = (c) => {
        const shopName = shopDetails?.shopName || 'Tyre Shop';
        const msg = lang === 'ta'
            ? `வணக்கம் ${c.name}!\n\n${shopName} — உங்கள் வாகனத்தின் டயர்களை கடைசியாக ${new Date(c.lastVisit).toLocaleDateString('ta-IN')} அன்று பார்த்தோம். டயர் நிலை, காற்றழுத்தம் மற்றும் அலைன்மென்ட் சரிபார்க்க ஒரு முறை வந்து செல்லுங்கள்!\n\nநன்றி!`
            : `Hello ${c.name}!\n\nThis is ${shopName} — we last serviced your vehicle on ${new Date(c.lastVisit).toLocaleDateString('en-IN')}. Drop by for a quick tyre health, pressure and alignment check!\n\nThank you!`;
        openWhatsApp(c.phone, msg);
    };

    // Single pass over invoices producing per-customer aggregates. Previously
    // every card re-scanned the entire invoice list four times per render
    // (pending ×2, lifetime, visits) — O(customers × invoices) on each keystroke.
    const customers = useMemo(() => {
        const map = new Map();
        invoices.forEach(inv => {
            const key = inv.customer?.phone || inv.customer?.name || inv.id;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: inv.customer?.name || '',
                    phone: inv.customer?.phone || '',
                    vehicle: inv.customer?.vehicle || '',
                    lastVisit: inv.date,
                    pending: 0,
                    lifetime: 0,
                    visits: 0
                });
            }
            const c = map.get(key);
            c.pending += inv.balanceAmount || 0;
            c.lifetime += inv.total || 0;
            c.visits += 1;
            if (new Date(inv.date) > new Date(c.lastVisit)) {
                c.lastVisit = inv.date;
                // Keep the freshest contact details on the card.
                c.name = inv.customer?.name || c.name;
                c.phone = inv.customer?.phone || c.phone;
                c.vehicle = inv.customer?.vehicle || c.vehicle;
            }
        });
        return Array.from(map.values())
            .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    }, [invoices]);

    const filteredCustomers = useMemo(() => {
        const search = searchTerm.toLowerCase();
        const cutoff = followUpMonths > 0
            ? Date.now() - followUpMonths * 30 * 24 * 60 * 60 * 1000
            : null;
        return customers.filter(c => {
            if (cutoff && new Date(c.lastVisit).getTime() > cutoff) return false;
            if (!searchTerm) return c.name || c.phone || c.vehicle;
            return c.name.toLowerCase().includes(search)
                || c.phone.toLowerCase().includes(search)
                || c.vehicle.toLowerCase().includes(search);
        });
    }, [customers, searchTerm, followUpMonths]);

    // Incremental rendering for large customer bases.
    const PAGE_SIZE = 50;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    useEffect(() => setVisibleCount(PAGE_SIZE), [searchTerm, followUpMonths]);
    const pagedCustomers = useMemo(
        () => filteredCustomers.slice(0, visibleCount),
        [filteredCustomers, visibleCount]
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">{t.customers}</h1>
                    <p className="text-[var(--color-text-gray)] uppercase tracking-widest text-[10px] opacity-60">Manage your customer database and records</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                    <input
                        placeholder={t.search_customer}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                </div>
                {/* Win-back filters: who hasn't been back in a while */}
                <div className="flex gap-2">
                    {[
                        { m: 0, label: lang === 'ta' ? 'அனைவரும்' : 'All' },
                        { m: 3, label: lang === 'ta' ? '3+ மாதம்' : '3+ months' },
                        { m: 6, label: lang === 'ta' ? '6+ மாதம்' : '6+ months' },
                    ].map(f => (
                        <button
                            key={f.m}
                            onClick={() => setFollowUpMonths(f.m)}
                            className={cn(
                                "px-4 py-2 rounded-pill text-[11px] font-black uppercase tracking-wide border transition-all",
                                followUpMonths === f.m
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                    : "bg-[var(--color-bg-card)] text-[var(--color-text-gray)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            {followUpMonths > 0 && (
                <p className="text-xs font-semibold text-[var(--color-text-gray)]">
                    {lang === 'ta'
                        ? `${filteredCustomers.length} வாடிக்கையாளர்கள் ${followUpMonths}+ மாதங்களாக வரவில்லை — WhatsApp மூலம் அழையுங்கள்`
                        : `${filteredCustomers.length} customers haven't visited in ${followUpMonths}+ months — nudge them on WhatsApp`}
                </p>
            )}

            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <CustomerCardSkeleton key={i} />
                    ))
                ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-[var(--color-text-gray)]">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>{lang === 'ta' ? 'வாடிக்கையாளர்கள் யாரும் இல்லை' : 'No customers found'}</p>
                    </div>
                ) : (
                    pagedCustomers.map((c) => (
                        <Card
                            key={c.key}
                            onClick={() => navigate(`/customers/${encodeURIComponent(c.key)}`)}
                            className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 transition-colors cursor-pointer hover:border-[var(--color-primary)]"
                        >
                            <div className="flex items-start space-x-4">
                                <InitialAvatar name={c.name} />
                                <div>
                                    <h3 className="font-bold text-lg">{c.name || (lang === 'ta' ? 'வாடிக்கையாளர்' : 'Walk-in')}</h3>
                                    <div className="flex items-center text-sm text-[var(--color-text-gray)] space-x-4">
                                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {t.last_visit}: {new Date(c.lastVisit).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                                        <span>{c.phone}</span>
                                        {c.vehicle && <span className="uppercase font-mono bg-[var(--color-bg-dark)] px-2 rounded text-xs">{c.vehicle}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">{t.total_pending || 'Total Pending'}</p>
                                    <p className={cn(
                                        "font-bold text-xl",
                                        c.pending > 0 ? "text-warning" : "text-success"
                                    )}>
                                        ₹{c.pending.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">{t.lifetime_value}</p>
                                    <p className="font-bold text-xl text-[var(--color-primary)]">
                                        ₹{c.lifetime.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">{t.visits}</p>
                                    <p className="font-medium">{c.visits}</p>
                                </div>
                                {c.phone && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); sendWinBack(c); }}
                                        className="h-9 w-9 shrink-0 rounded-full bg-[#25D366] text-white flex items-center justify-center active:scale-95 transition-transform"
                                        title={lang === 'ta' ? 'WhatsApp அழைப்பு' : 'WhatsApp nudge'}
                                    >
                                        <WhatsAppIcon className="h-4 w-4" />
                                    </button>
                                )}
                                <Button variant="outline" size="sm" className="font-black uppercase tracking-tighter text-[10px]">
                                    {t.view_profile} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}

                {filteredCustomers.length > visibleCount && (
                    <div className="text-center pt-2">
                        <button
                            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                            className="px-6 py-3 rounded-control bg-[var(--color-bg-card)] border border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/40 transition-colors"
                        >
                            {lang === 'ta'
                                ? `மேலும் காட்டு (${filteredCustomers.length - visibleCount})`
                                : `Load more (${filteredCustomers.length - visibleCount} remaining)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerHistory;
