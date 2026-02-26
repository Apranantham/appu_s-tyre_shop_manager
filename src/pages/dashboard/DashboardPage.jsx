import React from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Package, AlertTriangle, Calendar, ShoppingCart, Clock, Eye, EyeOff, Wallet, Users, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase';

import StatCard from './components/StatCard';
import SalesChart from './components/SalesChart';
import LowStockAlert from './components/LowStockAlert';
import TopSellingProducts from './components/TopSellingProducts';
import { useInvoices } from '../../context/InvoiceContext';
import { useProducts } from '../../context/ProductContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn';
import { StatSkeleton, CompactStatSkeleton } from '../../components/ui/SkeletonVariants';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { invoices, loading: invoicesLoading } = useInvoices();
    const { products, loading: productsLoading } = useProducts();
    const { expenses, monthlyExpenses } = useExpenses();
    const { user, isAdmin } = useAuth();
    const shopDetails = useSettings().shopDetails;
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const [showValues, setShowValues] = React.useState(() => {
        const saved = localStorage.getItem('dashboard_show_values');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [staffFilter, setStaffFilter] = React.useState('all');
    const [showStaffDropdown, setShowStaffDropdown] = React.useState(false);
    const [allUsers, setAllUsers] = React.useState([]);

    // Fetch staff list for admin
    React.useEffect(() => {
        if (!isAdmin) return;
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllUsers(usersData);
        });
        return () => unsubscribe();
    }, [isAdmin]);

    // Build unique staff list from users + invoices
    const staffList = React.useMemo(() => {
        if (!isAdmin) return [];
        const map = new Map();
        allUsers.forEach(u => {
            map.set(u.id, { id: u.id, label: u.email || u.name || u.id });
        });
        invoices.forEach(inv => {
            const id = inv.createdBy;
            if (id && !map.has(id)) {
                map.set(id, { id, label: inv.creatorEmail || inv.creatorName || id });
            }
        });
        return Array.from(map.values());
    }, [isAdmin, allUsers, invoices]);

    const selectedStaffLabel = staffFilter === 'all'
        ? (lang === 'ta' ? 'அனைவரும்' : 'All Staff')
        : (staffList.find(s => s.id === staffFilter)?.label || staffFilter);

    const toggleValues = () => {
        setShowValues(prev => {
            const newValue = !prev;
            localStorage.setItem('dashboard_show_values', JSON.stringify(newValue));
            return newValue;
        });
    };

    const formatValue = (val) => {
        if (!showValues) return '₹ ****';
        return `₹${val.toLocaleString()}`;
    };

    // Filtered data
    const filteredInvoices = React.useMemo(() => {
        if (staffFilter === 'all') return invoices;
        return invoices.filter(inv => inv.createdBy === staffFilter);
    }, [invoices, staffFilter]);

    const filteredExpenses = React.useMemo(() => {
        if (staffFilter === 'all') return expenses;
        return expenses.filter(exp => exp.createdBy === staffFilter);
    }, [expenses, staffFilter]);

    const filteredMonthlyExpenses = React.useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        return filteredExpenses
            .filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            })
            .reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [filteredExpenses]);

    const stats = React.useMemo(() => {
        if (invoicesLoading || productsLoading) return null;
        const now = new Date();
        const today = now.toDateString();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        let dailySales = 0;
        let yesterdaySales = 0;
        let monthlySales = 0;
        let prevMonthlySales = 0;
        let pendingTotal = 0;

        filteredInvoices.forEach(inv => {
            if (!inv.isClosed && (inv.paymentStatus === 'pending' || inv.paymentStatus === 'partially_paid')) {
                pendingTotal += (inv.balanceAmount || 0);
            }
            const d = new Date(inv.date);
            const invDay = d.toDateString();
            const invMonth = d.getMonth();
            const invYear = d.getFullYear();

            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yesterdayDateStr = yesterday.toDateString();

            if (invDay === today) {
                dailySales += inv.total;
            }

            if (invDay === yesterdayDateStr) {
                yesterdaySales += inv.total;
            }

            if (invMonth === thisMonth && invYear === thisYear) {
                monthlySales += inv.total;
            }

            if (invMonth === lastMonth && invYear === lastMonthYear) {
                prevMonthlySales += inv.total;
            }
        });

        const monthGrowth = prevMonthlySales === 0
            ? (monthlySales > 0 ? 100 : 0)
            : ((monthlySales - prevMonthlySales) / prevMonthlySales) * 100;

        const dayGrowth = yesterdaySales === 0
            ? (dailySales > 0 ? 100 : 0)
            : ((dailySales - yesterdaySales) / yesterdaySales) * 100;
        const profit = monthlySales - filteredMonthlyExpenses;

        return {
            dailySales,
            dayGrowth: dayGrowth.toFixed(1),
            monthlySales,
            profit,
            monthGrowth: monthGrowth.toFixed(1),
            pendingTotal,
            monthlyExpenses: filteredMonthlyExpenses
        };
    }, [filteredInvoices, filteredMonthlyExpenses]);

    return (
        <div className="space-y-8 w-full max-w-full overflow-hidden pb-10">
            {/* Header / Summary Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">{t.dashboard}</h1>
                    <p className="text-[var(--color-text-gray)] text-sm">{t.real_time_overview}</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* Admin Staff Filter */}
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                                    staffFilter !== 'all'
                                        ? "border-purple-500 bg-purple-500/10 text-purple-400"
                                        : "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-gray)]"
                                )}
                            >
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline max-w-[120px] truncate">{selectedStaffLabel}</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            {showStaffDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowStaffDropdown(false)}></div>
                                    <div className="absolute right-0 mt-2 w-64 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto">
                                        <button
                                            onClick={() => { setStaffFilter('all'); setShowStaffDropdown(false); }}
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-bg-dark)] transition-colors flex items-center gap-2",
                                                staffFilter === 'all' && "text-purple-400"
                                            )}
                                        >
                                            <Users className="h-4 w-4" />
                                            {lang === 'ta' ? 'அனைவரும்' : 'All Staff'}
                                        </button>
                                        <div className="h-px bg-[var(--color-border)] my-1"></div>
                                        {staffList.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => { setStaffFilter(s.id); setShowStaffDropdown(false); }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-bg-dark)] transition-colors truncate",
                                                    staffFilter === s.id && "text-purple-400"
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <button
                        onClick={toggleValues}
                        className="p-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-gray)] hover:text-[var(--color-primary)] transition-all"
                        title={showValues ? "Hide Values" : "Show Values"}
                    >
                        {showValues ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <div className="hidden md:block">
                        <span className="text-[var(--color-text-gray)] text-xs font-bold uppercase tracking-widest bg-[var(--color-bg-card)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                            {new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Featured Stats Grid */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {(invoicesLoading || productsLoading) ? (
                    <StatSkeleton />
                ) : (
                    <StatCard
                        title={t.monthly_revenue}
                        value={formatValue(stats.monthlySales)}
                        trend={stats.monthGrowth >= 0 ? 'up' : 'down'}

                        trendValue={`${stats.monthGrowth >= 0 ? '+' : ''}${stats.monthGrowth}%`}
                        icon={IndianRupee}
                        variant="featured"
                        className="h-44 md:h-auto lg:h-full"
                    />
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:col-span-2">
                    {(invoicesLoading || productsLoading) ? (
                        <>
                            <CompactStatSkeleton />
                            <CompactStatSkeleton />
                            <CompactStatSkeleton />
                            <CompactStatSkeleton />
                        </>
                    ) : (
                        <>
                            <div
                                onClick={() => navigate('/history', { state: { dateFilter: 'today' } })}
                                className="cursor-pointer active:scale-[0.98] transition-all group/stat"
                            >
                                <StatCard
                                    title={t.todays_sales}
                                    value={formatValue(stats.dailySales)}
                                    trend={stats.dayGrowth >= 0 ? 'up' : 'down'}
                                    trendValue={`${stats.dayGrowth >= 0 ? '+' : ''}${stats.dayGrowth}%`}
                                    icon={TrendingUp}
                                    variant="compact"
                                    className="min-h-[10rem] md:min-h-0 group-hover/stat:border-[var(--color-primary)]/50 transition-colors"
                                />
                            </div>
                            <StatCard
                                title={t.real_profit || 'Real Profit'}
                                value={formatValue(stats.profit)}
                                trend={stats.profit >= 0 ? 'up' : 'down'}
                                trendValue={stats.profit >= 0 ? 'Profit' : 'Loss'}
                                icon={stats.profit >= 0 ? TrendingUp : TrendingDown}
                                variant="compact"
                                className="min-h-[10rem] md:min-h-0"
                            />
                            <div
                                onClick={() => navigate('/expenses')}
                                className="cursor-pointer active:scale-[0.98] transition-all group/stat"
                            >
                                <StatCard
                                    title={t.monthly_expenses || 'Monthly Expenses'}
                                    value={formatValue(stats.monthlyExpenses)}
                                    trend="none"
                                    trendValue={t.view_details || 'View Details'}
                                    icon={Wallet}
                                    variant="compact"
                                    className="border-red-500/30 min-h-[10rem] md:min-h-0 group-hover/stat:border-red-500/60 transition-colors"
                                />
                            </div>
                            <div
                                onClick={() => navigate('/history', { state: { statusFilter: 'pending' } })}
                                className="cursor-pointer active:scale-[0.98] transition-all"
                            >
                                <StatCard
                                    title={t.pending_payments}
                                    value={formatValue(stats.pendingTotal)}
                                    trend="none"
                                    trendValue={t.action_required}
                                    icon={Clock}
                                    variant="compact"
                                    className="border-orange-500/30 min-h-[10rem] md:min-h-0 hover:border-orange-500/60 transition-colors"
                                />
                            </div>

                        </>
                    )}
                </div>
            </div>

            {/* Interactive Analytics Chart */}
            <div className="grid gap-6 min-w-0">
                <div className="min-h-[350px] md:min-h-[500px] lg:min-h-[600px] min-w-0 bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] p-4 md:p-6">
                    <SalesChart staffFilter={staffFilter} />
                </div>
            </div>

            {/* Secondary Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                <LowStockAlert />
                <TopSellingProducts invoices={filteredInvoices || []} />
            </div>
        </div>
    );
};

export default DashboardPage;
