import React, { useState } from 'react';
import { Search, Package, Wrench, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useProducts } from '../../../context/ProductContext';
import { useServices } from '../../../context/ServiceContext';
import { FALLBACK_IMAGE } from '../../../utils/constants';

const BillingItems = ({ onAddToCart }) => {
    const { products } = useProducts();
    const { services } = useServices();
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'services'
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const size = (p.size || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || size.includes(search);
    });

    const filteredServices = services.filter(s => {
        const name = (s.name || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return (s.active !== false) && name.includes(search);
    });

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl md:mr-4 overflow-hidden w-full max-w-full">
            {/* Tabs & Search */}
            <div className="p-4 border-b border-[var(--color-border)] space-y-6">
                <div className="flex p-1 bg-[var(--color-bg-dark)] rounded-lg">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'products'
                            ? 'bg-[var(--color-bg-card)] text-[var(--color-text-white)] shadow-sm'
                            : 'text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]'
                            }`}
                    >
                        <div className="flex items-center justify-center">
                            <Package className="mr-2 h-4 w-4" /> Products
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'services'
                            ? 'bg-[var(--color-bg-card)] text-[var(--color-text-white)] shadow-sm'
                            : 'text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]'
                            }`}
                    >
                        <div className="flex items-center justify-center">
                            <Wrench className="mr-2 h-4 w-4" /> Services
                        </div>
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                    <input
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-10 min-w-0 pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 min-w-0">
                    {activeTab === 'products' ? (
                        filteredProducts.map(product => (
                            <Card
                                key={product.id}
                                className="cursor-pointer hover:border-[var(--color-primary)] transition-all p-3 flex flex-col h-full group"
                                onClick={() => product.stock > 0 && onAddToCart(product, 'product')}
                            >
                                <div className="aspect-square rounded mb-2 bg-[var(--color-bg-dark)] overflow-hidden">
                                    <img src={product.image || FALLBACK_IMAGE} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm line-clamp-2 leading-tight mb-1">{product.name}</h4>
                                    <p className="text-xs text-[var(--color-text-gray)] mb-2">{product.size}</p>
                                </div>
                                <div className="mt-auto flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[var(--color-primary)]">₹{product.price}</span>
                                        <span className={`text-[10px] font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "text-white p-1 rounded-full transition-all",
                                        product.stock > 0 ? "bg-[var(--color-primary)] opacity-0 group-hover:opacity-100" : "bg-gray-700 cursor-not-allowed"
                                    )}>
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        filteredServices.map(service => (
                            <Card
                                key={service.id}
                                className="cursor-pointer hover:border-[var(--color-secondary)] transition-all p-4 flex flex-col justify-between group h-32"
                                onClick={() => onAddToCart(service, 'service')}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-secondary)]">
                                        <Wrench className="h-5 w-5" />
                                    </div>
                                    <span className="font-bold">₹{service.price}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{service.name}</h4>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingItems;
