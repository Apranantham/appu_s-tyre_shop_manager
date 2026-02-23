import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Package, Wrench, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

const BottomNav = () => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] flex items-end justify-around z-50 pb-2 px-2">
            <NavLink
                to="/dashboard"
                className={({ isActive }) => cn("flex flex-col items-center justify-center w-16 h-14 mb-1", isActive ? "text-[#3B82F6]" : "text-[var(--color-text-gray)]")}
            >
                <Home className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Home</span>
            </NavLink>

            <NavLink
                to="/customers"
                className={({ isActive }) => cn("flex flex-col items-center justify-center w-16 h-14 mb-1", isActive ? "text-[#3B82F6]" : "text-[var(--color-text-gray)]")}
            >
                <Users className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Customer</span>
            </NavLink>

            {/* Central Action Button */}
            <div className="relative -top-5">
                <NavLink
                    to="/billing"
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-[#3B82F6] text-white shadow-lg shadow-blue-500/40 border-4 border-[var(--color-bg-dark)] active:scale-95 transition-transform"
                >
                    <Plus className="h-8 w-8" />
                </NavLink>
            </div>

            <NavLink
                to="/services"
                className={({ isActive }) => cn("flex flex-col items-center justify-center w-16 h-14 mb-1", isActive ? "text-[#3B82F6]" : "text-[var(--color-text-gray)]")}
            >
                <Wrench className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Service</span>
            </NavLink>

            <NavLink
                to="/inventory"
                className={({ isActive }) => cn("flex flex-col items-center justify-center w-16 h-14 mb-1", isActive ? "text-[#3B82F6]" : "text-[var(--color-text-gray)]")}
            >
                <Package className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Stock</span>
            </NavLink>
        </div>
    );
};

export default BottomNav;
