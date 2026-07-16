import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Wrench,
    Package,
    Users,
    Settings,
    Sun,
    Moon,
    LogOut,
    History,
    ShieldCheck,
    Wallet,
    BookOpen,
    HandCoins,
    Truck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn';

const Sidebar = ({ isMobile }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout, isAuthenticated } = useAuth();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const navItems = [
        { icon: LayoutDashboard, label: t.dashboard, path: '/dashboard' },
        { icon: ShoppingCart, label: t.billing, path: '/billing' },
        { icon: Package, label: t.inventory, path: '/inventory' },
        { icon: Wrench, label: t.services, path: '/services' },
        { icon: Users, label: t.customers, path: '/customers' },
        { icon: History, label: t.history, path: '/history' },
        { icon: BookOpen, label: t.day_book || 'Day Book', path: '/daybook' },
        { icon: HandCoins, label: t.dues || 'Dues', path: '/dues' },
        { icon: Wallet, label: t.expenses || 'Expenses', path: '/expenses' },
        { icon: Truck, label: t.suppliers || 'Suppliers', path: '/suppliers' },
        { icon: Settings, label: t.settings, path: '/settings' },
        ...(user?.isAdmin ? [{ icon: ShieldCheck, label: t.admin_panel, path: '/admin' }] : []),
    ];


    return (
        <aside className={cn(
            "z-40 h-screen w-64 bg-[var(--color-bg-card)] border-r border-[var(--color-border)] transition-transform",
            isMobile ? "relative" : "fixed left-0 top-0"
        )}>
            <div className="flex h-full flex-col">
                {/* Brand block */}
                <div className="flex h-16 items-center border-b border-[var(--color-border)] px-5">
                    <div className="h-10 w-10 mr-3 shrink-0 rounded-control bg-primary-soft border border-primary/30 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <span className="block text-base font-black tracking-tight text-[var(--color-text-white)] truncate leading-tight">
                            {shopDetails?.shopName || 'TurboTyre'}
                        </span>
                        <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-primary">
                            Tyre&nbsp;POS
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    'relative flex items-center rounded-control px-3 py-2.5 text-sm font-semibold transition-colors',
                                    isActive
                                        ? 'bg-primary-soft text-primary'
                                        : 'text-[var(--color-text-gray)] hover:bg-[var(--color-bg-dark)] hover:text-[var(--color-text-white)]'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-pill bg-primary" />
                                    )}
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="border-t border-[var(--color-border)] p-4 space-y-2">
                    {isAuthenticated && (
                        <div className="flex items-center space-x-3 px-3 py-2 bg-[var(--color-bg-dark)] rounded-lg mb-2">
                            <img src={user.picture} alt="" className="h-8 w-8 rounded-full border border-[var(--color-primary)]" />
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold truncate">{user.name}</p>
                                <p className="text-[10px] text-[var(--color-text-gray)] truncate">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={toggleTheme}
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-gray)] hover:bg-[var(--color-bg-dark)] hover:text-[var(--color-text-white)] transition-colors"
                    >
                        {theme === 'dark' ? (
                            <><Sun className="mr-3 h-5 w-5" /> {t.light_mode}</>
                        ) : (
                            <><Moon className="mr-3 h-5 w-5" /> {t.dark_mode}</>
                        )}
                    </button>

                    {isAuthenticated && (
                        <button
                            onClick={logout}
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            {t.logout}
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
