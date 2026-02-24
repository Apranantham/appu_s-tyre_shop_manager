import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Star } from 'lucide-react';

import { FALLBACK_IMAGE } from '../../../utils/constants';

const TopSellingProducts = ({ invoices = [] }) => {
    const topProducts = React.useMemo(() => {
        const salesMap = {};

        invoices.forEach(inv => {
            inv.items.forEach(item => {
                if (item.type === 'product') {
                    if (!salesMap[item.id]) {
                        salesMap[item.id] = {
                            id: item.id,
                            name: item.name,
                            image: item.image,
                            sales: 0
                        };
                    }
                    salesMap[item.id].sales += item.quantity;
                }
            });
        });

        return Object.values(salesMap)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3);
    }, [invoices]);

    const maxSales = topProducts.length > 0 ? topProducts[0].sales : 100;

    return (
        <Card className="rounded-3xl p-4 md:p-6 bg-[var(--color-bg-card)] border-none md:border border-[var(--color-border)]">
            <div className="flex items-center space-x-2 mb-6">
                <Star className="text-yellow-500 h-5 w-5" />
                <h3 className="font-bold text-lg text-[var(--color-text-white)]">Top Selling Products</h3>
            </div>

            <div className="space-y-6">
                {topProducts.map((item, index) => (
                    <div key={item.id}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-lg bg-[var(--color-bg-dark)] overflow-hidden">
                                    <img src={item.image || FALLBACK_IMAGE} alt={item.name} className="h-full w-full object-cover" />
                                </div>
                                <h4 className="font-bold text-sm text-[var(--color-text-white)]">{item.name}</h4>
                            </div>
                            <span className="text-[#3B82F6] font-bold text-sm">{item.sales} Sold</span>
                        </div>

                        <div className="w-full bg-[var(--color-bg-dark)] rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-[#3B82F6] h-1.5 rounded-full"
                                style={{ width: `${(item.sales / maxSales) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
                {topProducts.length === 0 && (
                    <div className="text-center py-10 text-[var(--color-text-gray)]">
                        <p className="text-sm">No sales data yet</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TopSellingProducts;
