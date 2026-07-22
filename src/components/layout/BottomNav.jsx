import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Users, Plus, HandCoins, LayoutGrid, X,
    Package, Wrench, Truck, BookOpen, History, Wallet, Settings, ShieldCheck, ScrollText
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn';

const BottomNav = () => {
    const { shopDetails } = useSettings();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const [moreOpen, setMoreOpen] = useState(false);

    // A tab in the flat bar. Active = accent colour + a small indicator pill,
    // with a smooth transition; comfortable 60px targets for one-handed use.
    const Tab = ({ to, icon: Icon, label }) => (
        <NavLink to={to} className="flex-1 min-w-0">
            {({ isActive }) => (
                <div className="flex flex-col items-center justify-center gap-1 h-full relative">
                    <span className={cn('absolute top-0 h-0.5 w-8 rounded-full transition-all duration-300',
                        isActive ? 'bg-primary opacity-100' : 'opacity-0')} />
                    <Icon className={cn('h-[22px] w-[22px] transition-colors', isActive ? 'text-primary' : 'text-[var(--color-text-gray)]')} />
                    <span className={cn('text-[10px] font-bold tracking-tight transition-colors truncate max-w-full',
                        isActive ? 'text-primary' : 'text-[var(--color-text-gray)]')}>{label}</span>
                </div>
            )}
        </NavLink>
    );

    // Everything not on the bar lives in the More sheet — makes previously
    // buried pages reachable in two thumb taps from the easiest screen edge.
    const moreItems = [
        { to: '/inventory', icon: Package, label: t.inventory },
        { to: '/services', icon: Wrench, label: t.services },
        { to: '/suppliers', icon: Truck, label: t.suppliers || 'Suppliers' },
        { to: '/daybook', icon: BookOpen, label: t.day_book || 'Day Book' },
        { to: '/history', icon: History, label: t.history },
        { to: '/expenses', icon: Wallet, label: t.expenses || 'Expenses' },
        { to: '/inventory/stock-log', icon: ScrollText, label: t.stock_log || 'Stock Log' },
        { to: '/settings', icon: Settings, label: t.settings },
        ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: t.admin_panel || 'Admin' }] : []),
    ];

    const go = (to) => { setMoreOpen(false); navigate(to); };

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
                <div className="h-16 flex items-stretch px-1">
                    <Tab to="/dashboard" icon={Home} label={t.home} />
                    <Tab to="/customers" icon={Users} label={t.customers} />

                    {/* New Bill — the primary POS action, prominent but flat */}
                    <div className="flex-1 flex items-center justify-center">
                        <button
                            onClick={() => navigate('/billing')}
                            className="h-12 w-12 -mt-4 rounded-full bg-primary text-white flex items-center justify-center shadow-card border-4 border-[var(--color-bg-card)] active:scale-90 transition-transform"
                            aria-label={t.billing}
                        >
                            <Plus className="h-6 w-6 stroke-[2.5px]" />
                        </button>
                    </div>

                    <Tab to="/dues" icon={HandCoins} label={t.dues || 'Dues'} />

                    <button onClick={() => setMoreOpen(true)} className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 text-[var(--color-text-gray)] active:scale-95 transition-transform">
                        <LayoutGrid className="h-[22px] w-[22px]" />
                        <span className="text-[10px] font-bold tracking-tight">{lang === 'ta' ? 'மேலும்' : 'More'}</span>
                    </button>
                </div>
            </nav>

            {/* More sheet */}
            {moreOpen && (
                <div className="md:hidden fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMoreOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] rounded-t-panel p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-black uppercase tracking-widest text-[var(--color-text-gray)]">{lang === 'ta' ? 'மேலும்' : 'More'}</span>
                            <button onClick={() => setMoreOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-control text-[var(--color-text-gray)] hover:bg-[var(--color-bg-dark)]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {moreItems.map(item => (
                                <button key={item.to} onClick={() => go(item.to)} className="flex flex-col items-center justify-center gap-2 py-3 rounded-card bg-[var(--color-bg-dark)]/50 border border-[var(--color-border)] active:scale-95 transition-transform">
                                    <item.icon className="h-6 w-6 text-primary" />
                                    <span className="text-[10px] font-bold text-center text-[var(--color-text)] leading-tight">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BottomNav;
