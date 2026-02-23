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
        return (p.isActive !== false) && (name.includes(search) || size.includes(search));
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
                <div className={cn(
                    "grid gap-4 min-w-0",
                    (activeTab === 'products' ? filteredProducts.length > 0 : filteredServices.length > 0)
                        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
                        : "grid-cols-1"
                )}>
                    {activeTab === 'products' ? (
                        filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <Card
                                    key={product.id}
                                    className="cursor-pointer border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all p-4 flex flex-col h-full group shadow-md hover:shadow-xl active:scale-[0.98] rounded-2xl"
                                    onClick={() => product.stock > 0 && onAddToCart(product, 'product')}
                                >
                                    <div className="aspect-square rounded-xl mb-3 bg-[var(--color-bg-dark)] overflow-hidden">
                                        <img src={product.image || FALLBACK_IMAGE} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm line-clamp-2 leading-tight mb-1">{product.name}</h4>
                                        <p className="text-xs text-[var(--color-text-gray)] mb-3">{product.size}</p>
                                    </div>
                                    <div className="mt-auto flex justify-between items-center pt-2 border-t border-[var(--color-border)]/50">
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
                            <div className="col-span-full py-16 text-center animate-fade-in">
                                <Package className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-gray)] opacity-20" />
                                <h3 className="text-lg font-bold mb-1">No Products Found</h3>
                                <p className="text-sm text-[var(--color-text-gray)] mb-6">We couldn't find any products matching your search.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm('')}
                                    className="border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded-full px-6"
                                >
                                    Clear Search
                                </Button>
                            </div>
                        )
                    ) : (
                        filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <Card
                                    key={service.id}
                                    className="cursor-pointer border border-[var(--color-border)] hover:border-[var(--color-secondary)] transition-all p-5 flex flex-col justify-between group h-40 shadow-md hover:shadow-xl active:scale-[0.98] rounded-2xl"
                                    onClick={() => onAddToCart(service, 'service')}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-[var(--color-bg-dark)] rounded-xl text-[var(--color-secondary)] shadow-sm group-hover:scale-110 transition-transform">
                                            <Wrench className="h-6 w-6" />
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs text-[var(--color-text-gray)] font-bold uppercase tracking-wider mb-0.5">Price</span>
                                            <span className="font-bold text-lg">₹{service.price}</span>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <h4 className="font-bold text-sm group-hover:text-[var(--color-secondary)] transition-colors">{service.name}</h4>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-16 text-center animate-fade-in">
                                <Wrench className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-gray)] opacity-20" />
                                <h3 className="text-lg font-bold mb-1">No Services Found</h3>
                                <p className="text-sm text-[var(--color-text-gray)] mb-6">We couldn't find any services matching your search.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm('')}
                                    className="border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded-full px-6"
                                >
                                    Clear Search
                                </Button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingItems;
