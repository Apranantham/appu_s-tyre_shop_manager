import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Bell, Settings, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const Layout = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-dark)] text-[var(--color-text-white)] w-full">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <div className={cn(
                "md:hidden fixed inset-y-0 left-0 z-[70] w-64 bg-[var(--color-bg-card)] shadow-2xl transition-transform duration-300 transform border-r border-[var(--color-border)]",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
                        <span className="text-xl font-bold tracking-tight">Menu</span>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 hover:bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)]"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto" onClick={() => setIsSidebarOpen(false)}>
                        <Sidebar isMobile />
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-[var(--color-bg-dark)]/95 backdrop-blur-sm border-b border-[var(--color-border)] flex items-center justify-between px-4">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-gray)] active:scale-95 transition-transform"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div
                        className="flex items-center space-x-3 cursor-pointer active:opacity-70 transition-opacity"
                        onClick={() => navigate('/settings')}
                    >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5">
                            <div className="h-full w-full rounded-full bg-[var(--color-bg-card)] overflow-hidden">
                                <img
                                    src={isAuthenticated ? user.picture : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold leading-tight line-clamp-1">
                                {isAuthenticated ? user.name : "TurboTyre Central"}
                            </h1>
                            <p className="text-[10px] font-bold text-[#3B82F6] tracking-wide uppercase">
                                {isAuthenticated ? "Store Manager" : "Guest Mode"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="h-10 w-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center text-[var(--color-text-gray)] hover:text-[var(--color-text-white)] transition-colors">
                        <Bell className="h-5 w-5" />
                    </button>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => cn(
                            "h-10 w-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center transition-colors",
                            isActive ? "text-[#3B82F6]" : "text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                    </NavLink>
                </div>
            </div>

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav />

            {/* Main Content */}
            <main className="flex-1 transition-[padding] pt-20 pb-24 md:pt-0 md:pb-0 md:pl-64 w-full max-w-[100vw] overflow-x-hidden">
                <div className="container mx-auto p-4 md:p-6 max-w-7xl animate-fade-in w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
