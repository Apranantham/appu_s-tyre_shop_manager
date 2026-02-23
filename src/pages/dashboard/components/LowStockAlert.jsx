import React from 'react';
import { Card } from '../../../components/ui/Card';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

import { useProducts } from '../../../context/ProductContext';
import { FALLBACK_IMAGE } from '../../../utils/constants';
import { useNavigate } from 'react-router-dom';

const LowStockAlert = () => {
    const navigate = useNavigate();
    const { products } = useProducts();

    const lowStockItems = React.useMemo(() => {
        return products
            .filter(p => p.stock <= p.minStock)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 4);
    }, [products]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                    <AlertCircle className="text-red-500 h-5 w-5" />
                    <h3 className="font-bold text-lg text-[var(--color-text-white)]">Low Stock Alert</h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-primary)] text-xs font-bold uppercase tracking-wide"
                    onClick={() => navigate('/inventory', { state: { filter: 'low_stock' } })}
                >
                    View All
                </Button>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:gap-4 md:space-x-0 md:overflow-visible">
                {lowStockItems.map((item) => (
                    <div key={item.id} className="min-w-[200px] p-4 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex flex-col items-center text-center space-y-3 relative group">
                        <div className="h-24 w-full rounded-2xl bg-[var(--color-bg-dark)] overflow-hidden">
                            <img src={item.image || FALLBACK_IMAGE} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="w-full text-left">
                            <h4 className="font-bold text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-[var(--color-text-gray)]">{item.size}</p>
                        </div>
                        <div className="w-full flex justify-between items-center bg-[var(--color-bg-dark)] rounded-full px-3 py-1.5 mt-2">
                            <span className="text-xs font-bold text-red-500 font-mono italic">{item.stock} LEFT</span>
                            <div className="h-5 w-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                <span className="text-white text-xs font-bold font-mono">+</span>
                            </div>
                        </div>
                    </div>
                ))}
                {lowStockItems.length === 0 && (
                    <div className="col-span-full py-10 bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border)] rounded-3xl text-center text-[var(--color-text-gray)]">
                        <p className="text-sm">No low stock alerts</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LowStockAlert;
