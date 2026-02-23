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
    ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const Sidebar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout, isAuthenticated } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ShoppingCart, label: 'Billing', path: '/billing' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Wrench, label: 'Services', path: '/services' },
        { icon: Users, label: 'Customer', path: '/customers' },
        { icon: History, label: 'History', path: '/history' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        ...(user?.isAdmin ? [{ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' }] : []),
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[var(--color-bg-card)] border-r border-[var(--color-border)] transition-transform">
            <div className="flex h-full flex-col">
                {/* Logo Area */}
                <div className="flex h-16 items-center border-b border-[var(--color-border)] px-6">
                    <Wrench className="h-8 w-8 text-[var(--color-primary)] mr-3" />
                    <span className="text-xl font-bold tracking-tight text-[var(--color-text-white)]">
                        TurboTyre
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'text-[var(--color-text-gray)] hover:bg-[var(--color-bg-dark)] hover:text-[var(--color-text-white)]'
                                )
                            }
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
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
                            <><Sun className="mr-3 h-5 w-5" /> Light Mode</>
                        ) : (
                            <><Moon className="mr-3 h-5 w-5" /> Dark Mode</>
                        )}
                    </button>

                    {isAuthenticated && (
                        <button
                            onClick={logout}
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
