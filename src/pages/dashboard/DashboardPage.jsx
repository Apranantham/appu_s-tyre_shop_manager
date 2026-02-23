import React, { useMemo } from 'react';
import { IndianRupee, TrendingUp, Package, AlertTriangle, Calendar, ShoppingCart } from 'lucide-react';
import StatCard from './components/StatCard';
import SalesChart from './components/SalesChart';
import LowStockAlert from './components/LowStockAlert';
import TopSellingProducts from './components/TopSellingProducts';
import { useInvoices } from '../../context/InvoiceContext';
import { useProducts } from '../../context/ProductContext';
import { StatSkeleton, CompactStatSkeleton } from '../../components/ui/SkeletonVariants';

const DashboardPage = () => {
    const { invoices, loading: invoicesLoading } = useInvoices();
    const { products, loading: productsLoading } = useProducts();

    const stats = useMemo(() => {
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

        invoices.forEach(inv => {
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

        // Growth calculation: 
        // If previous month was 0 and current is > 0, we show 100% growth (as it's new revenue)
        // Otherwise, use standard (current - prev) / prev formula
        const monthGrowth = prevMonthlySales === 0
            ? (monthlySales > 0 ? 100 : 0)
            : ((monthlySales - prevMonthlySales) / prevMonthlySales) * 100;

        const dayGrowth = yesterdaySales === 0
            ? (dailySales > 0 ? 100 : 0)
            : ((dailySales - yesterdaySales) / yesterdaySales) * 100;
        const profit = monthlySales * 0.4; // Assumption: 40% margin

        return {
            dailySales,
            dayGrowth: dayGrowth.toFixed(1),
            monthlySales,
            profit,
            monthGrowth: monthGrowth.toFixed(1)
        };
    }, [invoices]);

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden pb-10">
            {/* Header / Summary Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">DASHBOARD</h1>
                    <p className="text-[var(--color-text-gray)] text-sm">Real-time performance overview</p>
                </div>
                <div className="hidden md:block">
                    <span className="text-[var(--color-text-gray)] text-xs font-bold uppercase tracking-widest bg-[var(--color-bg-card)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Featured Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(invoicesLoading || productsLoading) ? (
                    <StatSkeleton />
                ) : (
                    <StatCard
                        title="MONTHLY REVENUE"
                        value={`₹${stats.monthlySales.toLocaleString()}`}
                        trend={stats.monthGrowth >= 0 ? 'up' : 'down'}
                        trendValue={`${stats.monthGrowth >= 0 ? '+' : ''}${stats.monthGrowth}%`}
                        icon={IndianRupee}
                        variant="featured"
                        className="h-44"
                    />
                )}

                <div className="grid grid-cols-2 gap-4 h-44 lg:col-span-2">
                    {(invoicesLoading || productsLoading) ? (
                        <>
                            <CompactStatSkeleton />
                            <CompactStatSkeleton />
                        </>
                    ) : (
                        <>
                            <StatCard
                                title="Today's Sales"
                                value={`₹${stats.dailySales.toLocaleString()}`}
                                trend={stats.dayGrowth >= 0 ? 'up' : 'down'}
                                trendValue={`${stats.dayGrowth >= 0 ? '+' : ''}${stats.dayGrowth}%`}
                                icon={TrendingUp}
                                variant="compact"
                            />
                            <StatCard
                                title="Est. Profit (40%)"
                                value={`₹${stats.profit.toLocaleString()}`}
                                trend={stats.monthGrowth >= 0 ? 'up' : 'down'}
                                trendValue={`${stats.monthGrowth >= 0 ? '+' : ''}${stats.monthGrowth}%`}
                                icon={TrendingUp}
                                variant="compact"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Interactive Analytics Chart */}
            <div className="grid gap-6">
                <div className="h-[500px]">
                    <SalesChart />
                </div>
            </div>

            {/* Secondary Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                <LowStockAlert />
                <TopSellingProducts invoices={invoices || []} />
            </div>
        </div>
    );
};

export default DashboardPage;
