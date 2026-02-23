import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { useInvoices } from '../../../context/InvoiceContext';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const SalesChart = () => {
    const { theme } = useTheme();
    const { invoices } = useInvoices();
    const isDark = theme === 'dark';

    const [range, setRange] = useState('weeks'); // 'days', 'weeks', 'months'
    const [offset, setOffset] = useState(0); // 0 = current, -1 = previous, etc.

    const chartData = useMemo(() => {
        const now = new Date();
        let dataMap = {};
        let labelFormat = {};

        if (range === 'days') {
            // Last 24 hours or specific day
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + offset);
            targetDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < 24; i++) {
                dataMap[i] = 0;
            }

            invoices.forEach(inv => {
                const invDate = new Date(inv.date);
                if (invDate.toDateString() === targetDate.toDateString()) {
                    const hour = invDate.getHours();
                    dataMap[hour] += inv.total;
                }
            });

            return Object.keys(dataMap).map(hour => ({
                name: `${hour}:00`,
                sales: dataMap[hour]
            }));
        }

        if (range === 'weeks') {
            // Last 7 days relative to offset
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i + (offset * 7));
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                dataMap[d.toDateString()] = { label, sales: 0 };
            }

            invoices.forEach(inv => {
                const dateStr = new Date(inv.date).toDateString();
                if (dataMap[dateStr]) {
                    dataMap[dateStr].sales += inv.total;
                }
            });

            return Object.values(dataMap).map(item => ({
                name: item.label,
                sales: item.sales
            }));
        }

        if (range === 'months') {
            // Months of specific year based on offset
            const targetYear = now.getFullYear() + offset;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            months.forEach((m, idx) => {
                dataMap[idx] = 0;
            });

            invoices.forEach(inv => {
                const d = new Date(inv.date);
                if (d.getFullYear() === targetYear) {
                    dataMap[d.getMonth()] += inv.total;
                }
            });

            return months.map((m, idx) => ({
                name: m,
                sales: dataMap[idx]
            }));
        }

        if (range === 'years') {
            // Last 5 years relative to offset
            for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i + (offset * 5);
                dataMap[year] = 0;
            }

            invoices.forEach(inv => {
                const year = new Date(inv.date).getFullYear();
                if (dataMap[year] !== undefined) {
                    dataMap[year] += inv.total;
                }
            });

            return Object.keys(dataMap).map(year => ({
                name: year,
                sales: dataMap[year]
            }));
        }

        return [];
    }, [invoices, range, offset]);

    const totalRevenue = chartData.reduce((sum, item) => sum + item.sales, 0);

    const getRangeLabel = () => {
        const now = new Date();
        if (range === 'days') {
            const d = new Date(now);
            d.setDate(now.getDate() + offset);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        if (range === 'weeks') {
            return `Period ${offset === 0 ? 'Current Week' : offset < 0 ? `${Math.abs(offset)} Week(s) Ago` : `${offset} Week(s) Ahead`}`;
        }
        if (range === 'months') {
            return `Year ${now.getFullYear() + offset}`;
        }
        if (range === 'years') {
            return `5-Year Overview (Offset: ${offset})`;
        }
        return '';
    };

    return (
        <Card className="h-full flex flex-col p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-[#3B82F6]" />
                        Revenue Analytics
                    </h3>
                    <p className="text-sm text-[var(--color-text-gray)]">{getRangeLabel()}</p>
                </div>

                <div className="flex flex-col items-end">
                    <div className="text-[#3B82F6] font-bold text-2xl">₹{totalRevenue.toLocaleString()}</div>
                    <div className="flex items-center space-x-2 mt-2">
                        <div className="flex bg-[var(--color-bg-dark)] rounded-lg p-1 border border-[var(--color-border)]">
                            {['days', 'weeks', 'months', 'years'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => { setRange(r); setOffset(0); }}
                                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${range === r
                                        ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20'
                                        : 'text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <div className="flex space-x-1">
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

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#E5E7EB'} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#9CA3AF' : '#1E293B', fontSize: 10, fontWeight: 'bold' }}
                            dy={10}
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
                        />
                        <Bar
                            dataKey="sales"
                            fill="#3B82F6"
                            radius={[6, 6, 0, 0]}
                            barSize={range === 'months' ? 20 : range === 'days' ? 12 : 30}
                        >
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default SalesChart;
