import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { useInvoices } from '../../../context/InvoiceContext';
import { useExpenses } from '../../../context/ExpenseContext';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const SalesChart = ({ staffFilter = 'all' }) => {
    const { theme } = useTheme();
    const { invoices: allInvoices } = useInvoices();
    const { expenses: allExpenses } = useExpenses();
    const isDark = theme === 'dark';

    const [range, setRange] = useState('weeks');
    const [offset, setOffset] = useState(0);
    const [view, setView] = useState('both');

    // Filter by staff
    const invoices = React.useMemo(() => {
        if (staffFilter === 'all') return allInvoices;
        return allInvoices.filter(inv => inv.createdBy === staffFilter);
    }, [allInvoices, staffFilter]);

    const expenses = React.useMemo(() => {
        if (staffFilter === 'all') return allExpenses;
        return allExpenses.filter(exp => exp.createdBy === staffFilter);
    }, [allExpenses, staffFilter]);

    const chartData = useMemo(() => {
        const now = new Date();

        if (range === 'days') {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + offset);
            targetDate.setHours(0, 0, 0, 0);

            const dataMap = {};
            for (let i = 0; i < 24; i++) {
                dataMap[i] = { revenue: 0, expense: 0 };
            }

            invoices.forEach(inv => {
                const recordedPayments = inv.payments || [];
                const recordedPaymentsTotal = recordedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

                const synthesizedPayments = [];
                if ((inv.paidAmount || 0) > recordedPaymentsTotal) {
                    const diff = inv.paidAmount - recordedPaymentsTotal;
                    synthesizedPayments.push({
                        amount: diff,
                        date: inv.date
                    });
                }

                const allInvPayments = [...synthesizedPayments, ...recordedPayments];

                allInvPayments.forEach(payment => {
                    const d = new Date(payment.date);
                    if (d.toDateString() === targetDate.toDateString()) {
                        dataMap[d.getHours()].revenue += (payment.amount || 0);
                    }
                });
            });

            expenses.forEach(exp => {
                const expDate = new Date(exp.date);
                if (expDate.toDateString() === targetDate.toDateString()) {
                    dataMap[expDate.getHours()].expense += (exp.amount || 0);
                }
            });

            return Object.keys(dataMap).map(hour => ({
                name: `${hour}:00`,
                revenue: dataMap[hour].revenue,
                expense: dataMap[hour].expense
            }));
        }

        if (range === 'weeks') {
            const dataMap = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i + (offset * 7));
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                dataMap[d.toDateString()] = { label, revenue: 0, expense: 0 };
            }

            invoices.forEach(inv => {
                const recordedPayments = inv.payments || [];
                const recordedPaymentsTotal = recordedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

                const synthesizedPayments = [];
                if ((inv.paidAmount || 0) > recordedPaymentsTotal) {
                    const diff = inv.paidAmount - recordedPaymentsTotal;
                    synthesizedPayments.push({
                        amount: diff,
                        date: inv.date
                    });
                }

                const allInvPayments = [...synthesizedPayments, ...recordedPayments];

                allInvPayments.forEach(payment => {
                    const dateStr = new Date(payment.date).toDateString();
                    if (dataMap[dateStr]) dataMap[dateStr].revenue += (payment.amount || 0);
                });
            });

            expenses.forEach(exp => {
                const dateStr = new Date(exp.date).toDateString();
                if (dataMap[dateStr]) dataMap[dateStr].expense += (exp.amount || 0);
            });

            return Object.values(dataMap).map(item => ({
                name: item.label,
                revenue: item.revenue,
                expense: item.expense
            }));
        }

        if (range === 'months') {
            const targetYear = now.getFullYear() + offset;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dataMap = {};
            months.forEach((_, idx) => { dataMap[idx] = { revenue: 0, expense: 0 }; });

            invoices.forEach(inv => {
                const recordedPayments = inv.payments || [];
                const recordedPaymentsTotal = recordedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

                const synthesizedPayments = [];
                if ((inv.paidAmount || 0) > recordedPaymentsTotal) {
                    const diff = inv.paidAmount - recordedPaymentsTotal;
                    synthesizedPayments.push({
                        amount: diff,
                        date: inv.date
                    });
                }

                const allInvPayments = [...synthesizedPayments, ...recordedPayments];

                allInvPayments.forEach(payment => {
                    const d = new Date(payment.date);
                    if (d.getFullYear() === targetYear) {
                        dataMap[d.getMonth()].revenue += (payment.amount || 0);
                    }
                });
            });

            expenses.forEach(exp => {
                const d = new Date(exp.date);
                if (d.getFullYear() === targetYear) dataMap[d.getMonth()].expense += (exp.amount || 0);
            });

            return months.map((m, idx) => ({
                name: m,
                revenue: dataMap[idx].revenue,
                expense: dataMap[idx].expense
            }));
        }

        if (range === 'years') {
            const dataMap = {};
            for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i + (offset * 5);
                dataMap[year] = { revenue: 0, expense: 0 };
            }

            invoices.forEach(inv => {
                (inv.payments || []).forEach(payment => {
                    const year = new Date(payment.date).getFullYear();
                    if (dataMap[year] !== undefined) dataMap[year].revenue += (payment.amount || 0);
                });
            });

            expenses.forEach(exp => {
                const year = new Date(exp.date).getFullYear();
                if (dataMap[year] !== undefined) dataMap[year].expense += (exp.amount || 0);
            });

            return Object.keys(dataMap).map(year => ({
                name: year,
                revenue: dataMap[year].revenue,
                expense: dataMap[year].expense
            }));
        }

        return [];
    }, [invoices, expenses, range, offset]);

    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpense = chartData.reduce((sum, item) => sum + item.expense, 0);

    const getRangeLabel = () => {
        const now = new Date();
        if (range === 'days') {
            const d = new Date(now);
            d.setDate(now.getDate() + offset);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        if (range === 'weeks') {
            return `${offset === 0 ? 'Current Week' : offset < 0 ? `${Math.abs(offset)} Week(s) Ago` : `${offset} Week(s) Ahead`}`;
        }
        if (range === 'months') {
            return `Year ${now.getFullYear() + offset}`;
        }
        if (range === 'years') {
            return `5-Year Overview (Offset: ${offset})`;
        }
        return '';
    };

    const showRevenue = view === 'revenue' || view === 'both';
    const showExpense = view === 'expense' || view === 'both';

    const barSize = range === 'months' ? 14 : range === 'days' ? 6 : view === 'both' ? 16 : 24;

    return (
        <Card className="flex flex-col p-4 md:p-6 bg-[var(--color-bg-card)] border-none md:border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-none md:shadow-sm h-full">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div className="w-full lg:w-auto">
                    <h3 className="text-xl font-bold flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-[#3B82F6]" />
                        Analytics
                    </h3>
                    <p className="text-sm text-[var(--color-text-gray)] whitespace-nowrap">{getRangeLabel()}</p>
                </div>

                <div className="flex flex-col items-start lg:items-end w-full lg:w-auto gap-2">
                    {/* Totals */}
                    <div className="flex items-center gap-4">
                        {showRevenue && (
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Revenue</p>
                                <p className="text-[#3B82F6] font-bold text-xl">₹{totalRevenue.toLocaleString()}</p>
                            </div>
                        )}
                        {showExpense && (
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Expense</p>
                                <p className="text-red-500 font-bold text-xl">₹{totalExpense.toLocaleString()}</p>
                            </div>
                        )}
                        {view === 'both' && (
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Profit</p>
                                <p className={cn("font-bold text-xl", totalRevenue - totalExpense >= 0 ? "text-green-500" : "text-orange-500")}>
                                    ₹{(totalRevenue - totalExpense).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-2 w-full justify-between lg:justify-end flex-wrap">
                        {/* View Toggle */}
                        <div className="flex bg-[var(--color-bg-dark)] rounded-lg p-1 border border-[var(--color-border)]">
                            {[
                                { id: 'revenue', label: 'Revenue', color: 'bg-[#3B82F6]' },
                                { id: 'both', label: 'Both', color: 'bg-[#3B82F6]' },
                                { id: 'expense', label: 'Expense', color: 'bg-red-500' },
                            ].map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setView(v.id)}
                                    className={cn(
                                        "px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all whitespace-nowrap",
                                        view === v.id
                                            ? `${v.color} text-white shadow-lg`
                                            : "text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]"
                                    )}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>

                        {/* Range Selector */}
                        <div className="flex bg-[var(--color-bg-dark)] rounded-lg p-1 border border-[var(--color-border)] overflow-x-auto no-scrollbar">
                            {['days', 'weeks', 'months', 'years'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => { setRange(r); setOffset(0); }}
                                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all whitespace-nowrap ${range === r
                                        ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20'
                                        : 'text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex space-x-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-[var(--color-bg-dark)] rounded-lg border border-[var(--color-border)]"
                                onClick={() => setOffset(prev => prev - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-[var(--color-bg-dark)] rounded-lg border border-[var(--color-border)]"
                                onClick={() => setOffset(prev => prev + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-[400px] mt-4 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#E5E7EB'} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#9CA3AF' : '#1E293B', fontSize: 11, fontWeight: 'bold' }}
                            dy={10}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#9CA3AF' : '#1E293B', fontSize: 10 }}
                            tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1F2937' : 'var(--color-bg-card)',
                                borderColor: isDark ? '#374151' : '#E5E7EB',
                                borderRadius: '12px',
                                color: isDark ? '#F9FAFB' : '#0F172A',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            cursor={{ fill: isDark ? '#374151' : '#F3F4F6', opacity: 0.4 }}
                            formatter={(value, name) => [
                                `₹${value.toLocaleString()}`,
                                name === 'revenue' ? 'Revenue' : 'Expense'
                            ]}
                        />
                        {showRevenue && (
                            <Bar
                                dataKey="revenue"
                                fill="#3B82F6"
                                radius={[6, 6, 0, 0]}
                                barSize={barSize}
                                activeBar={false}
                                style={{ outline: 'none' }}
                            />
                        )}
                        {showExpense && (
                            <Bar
                                dataKey="expense"
                                fill="#EF4444"
                                radius={[6, 6, 0, 0]}
                                barSize={barSize}
                                activeBar={false}
                                style={{ outline: 'none' }}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default SalesChart;
