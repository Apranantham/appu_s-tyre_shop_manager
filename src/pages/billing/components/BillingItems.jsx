import React, { useState } from 'react';
import { Search, Package, Wrench, ChevronRight, Plus, Minus, X, ArrowLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useProducts } from '../../../context/ProductContext';
import { useServices } from '../../../context/ServiceContext';
import { useSettings } from '../../../context/SettingsContext';
import { translations } from '../../../utils/translations';
import { FALLBACK_IMAGE } from '../../../utils/constants';

const BillingItems = ({ onAddToCart, onUpdateQuantity, onRemoveItem, cart = [], onBack }) => {
    const { products } = useProducts();
    const { services } = useServices();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const [activeTab, setActiveTab] = useState('services'); // Default to services
    const [searchTerm, setSearchTerm] = useState('');

    const getItemQuantity = (id, type) => {
        const item = cart.find(i => i.id === id && i.type === type);
        return item ? item.quantity : 0;
    };

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
            {/* Header with Exit button if onBack is provided */}
            {onBack && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] shrink-0">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[var(--color-text-gray)] hover:text-[var(--color-primary)] transition-colors group"
                    >
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">{t.exit || 'Exit'}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        <h2 className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-gray)] uppercase">
                            {t.billing_mode || 'BILLING MODE'}
                        </h2>
                    </div>
                </div>
            )}
            {/* ... tabs ... */}
            <div className="p-4 border-b border-[var(--color-border)] space-y-4">
                {/* ... existing tab buttons ... */}
                <div className="flex bg-[var(--color-bg-dark)]/50 p-1 rounded-2xl border border-[var(--color-border)]">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex-1 flex items-center justify-center py-3 rounded-xl shadow-sm transition-all duration-300 ${activeTab === 'services'
                            ? 'bg-[var(--color-primary)] text-white font-black'
                            : 'text-[var(--color-text-gray)] hover:bg-[var(--color-bg-card)]'
                            }`}
                    >
                        <Wrench className={`h-5 w-5 mr-2 ${activeTab === 'services' ? 'animate-bounce' : ''}`} />
                        <div className="text-left">
                            <p className="text-[10px] uppercase opacity-70 leading-none">{t.services_tab}</p>
                            <p className="text-sm uppercase tracking-tighter font-black">{t.services_tab}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex items-center justify-center py-3 rounded-xl shadow-sm transition-all duration-300 ${activeTab === 'products'
                            ? 'bg-[var(--color-primary)] text-white font-black'
                            : 'text-[var(--color-text-gray)] hover:bg-[var(--color-bg-card)]'
                            }`}
                    >
                        <Package className={`h-5 w-5 mr-2 ${activeTab === 'products' ? 'animate-bounce' : ''}`} />
                        <div className="text-left">
                            <p className="text-[10px] uppercase opacity-70 leading-none">{t.products}</p>
                            <p className="text-sm uppercase tracking-tighter font-black">{t.products}</p>
                        </div>
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                    <input
                        placeholder={t.search_placeholder(activeTab)}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border-2 border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:opacity-40"
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
                            filteredProducts.map(product => {
                                const qtyInCart = getItemQuantity(product.id, 'product');
                                return (
                                    <Card
                                        key={product.id}
                                        className={cn(
                                            "relative cursor-pointer border-2 transition-all p-4 flex flex-col h-full group shadow-md hover:shadow-xl active:scale-[0.98] rounded-2xl bg-[var(--color-bg-dark)]/40",
                                            qtyInCart > 0 ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)] hover:border-blue-500"
                                        )}
                                        onClick={() => product.stock > 0 && onAddToCart(product, 'product')}
                                    >
                                        {qtyInCart > 0 && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onRemoveItem(product.id, 'product'); }}
                                                    className="absolute -top-2 -left-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg border-4 border-[var(--color-bg-card)] z-20 hover:scale-110 active:scale-95 transition-all"
                                                    title="Remove Item"
                                                >
                                                    <X className="h-4 w-4 stroke-[3px]" />
                                                </button>
                                                <div className="absolute -top-2 -right-2 h-8 w-8 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg border-4 border-[var(--color-bg-card)] z-10 animate-in zoom-in-50">
                                                    {qtyInCart}
                                                </div>
                                            </>
                                        )}

                                        <div className="mb-4">
                                            <h4 className="font-black text-sm md:text-base leading-tight uppercase tracking-tight text-[var(--color-text-white)]">{product.name}</h4>
                                            <p className="text-[10px] md:text-xs text-[var(--color-text-gray)] font-bold mt-1">{product.size}</p>
                                        </div>

                                        <div className="aspect-square rounded-2xl mb-4 bg-[var(--color-bg-dark)]/50 overflow-hidden border border-[var(--color-border)]/50 relative group-hover:border-blue-500/30 transition-colors">
                                            <img src={product.image || FALLBACK_IMAGE} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                                <span className="font-black text-sm text-blue-400">₹{product.price}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex justify-between items-center">
                                            <span className={`text-[9px] font-black tracking-widest px-2 py-1 rounded-md ${product.stock > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {product.stock > 0 ? `${t.in_stock.toUpperCase()}: ${product.stock}` : t.out_of_stock.toUpperCase()}
                                            </span>

                                            {qtyInCart > 0 && (
                                                <div className="flex items-center bg-blue-500/10 rounded-xl p-1 border border-blue-500/20 shadow-inner" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => qtyInCart > 1 ? onUpdateQuantity(product.id, 'product', -1) : onRemoveItem(product.id, 'product')}
                                                        className="p-1 hover:text-[var(--color-primary)] transition-colors"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="mx-2 text-xs font-black min-w-[1rem] text-center">{qtyInCart}</span>
                                                    <button
                                                        onClick={() => onAddToCart(product, 'product')}
                                                        className="p-1 hover:text-[var(--color-primary)] transition-colors"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 text-center animate-fade-in">
                                <Package className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-gray)] opacity-20" />
                                <h3 className="text-lg font-bold mb-1 uppercase tracking-widest">No Products Found</h3>
                                <p className="text-sm text-[var(--color-text-gray)] mb-6 uppercase opacity-60">We couldn't find anything matching your search.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm('')}
                                    className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-white)] rounded-full px-8 py-6 font-black uppercase text-xs"
                                >
                                    Clear / அழி
                                </Button>
                            </div>
                        )
                    ) : (
                        filteredServices.length > 0 ? (
                            filteredServices.map(service => {
                                const qtyInCart = getItemQuantity(service.id, 'service');
                                return (
                                    <Card
                                        key={service.id}
                                        className={cn(
                                            "relative cursor-pointer border-2 transition-all p-5 flex flex-col group min-h-[14rem] shadow-xl hover:shadow-2xl active:scale-[0.98] rounded-3xl overflow-visible",
                                            qtyInCart > 0
                                                ? "border-orange-500 bg-[var(--color-bg-dark)]"
                                                : "border-[var(--color-border)] bg-[var(--color-bg-dark)] hover:border-orange-500/50"
                                        )}
                                        onClick={() => onAddToCart(service, 'service')}
                                    >
                                        {/* Remove Button - Top Left Circle */}
                                        {qtyInCart > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveItem(service.id, 'service'); }}
                                                className="absolute -top-3 -left-3 h-9 w-9 bg-[#FF5252] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20 border-4 border-[var(--color-bg-dark)]"
                                                title="Remove Item"
                                            >
                                                <X className="h-5 w-5 stroke-[3px]" />
                                            </button>
                                        )}

                                        {/* Quantity Badge - Top Right Circle */}
                                        {qtyInCart > 0 && (
                                            <div className="absolute -top-3 -right-3 h-9 w-9 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg border-4 border-[var(--color-bg-dark)] z-10 animate-in zoom-in-50">
                                                {qtyInCart}
                                            </div>
                                        )}

                                        <div className="flex-1 space-y-4">
                                            {/* Service Name */}
                                            <h4 className="font-black text-sm md:text-base uppercase tracking-tight text-[var(--color-text-white)] leading-tight min-h-[2.5rem]">
                                                {service.name}
                                            </h4>

                                            <div className="flex items-center justify-between gap-4">
                                                {/* Wrench Icon Box */}
                                                <div className="h-16 w-16 bg-[var(--color-bg-card)] rounded-2xl flex items-center justify-center text-orange-500 shadow-inner group-hover:scale-105 transition-transform duration-300 border border-white/5">
                                                    <Wrench className="h-8 w-8" />
                                                </div>

                                                {/* Price Section */}
                                                <div className="text-right">
                                                    <span className="block text-[8px] text-[var(--color-text-gray)]/60 font-black uppercase tracking-[0.2em] mb-1">SERVICE COST</span>
                                                    <span className="font-black text-2xl text-orange-500 italic flex items-center justify-end">
                                                        <span className="text-lg mr-0.5">₹</span>{service.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Integrated Quantity Controls */}
                                        <div className="mt-5">
                                            <div
                                                className={cn(
                                                    "flex items-center justify-between bg-[var(--color-bg-card)] rounded-2xl p-1.5 border border-white/5 shadow-inner transition-all",
                                                    qtyInCart > 0 ? "opacity-100" : "opacity-30 group-hover:opacity-100"
                                                )}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => qtyInCart > 1 ? onUpdateQuantity(service.id, 'service', -1) : qtyInCart === 1 ? onRemoveItem(service.id, 'service') : null}
                                                    disabled={qtyInCart === 0}
                                                    className="h-10 w-10 flex items-center justify-center text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors disabled:opacity-20"
                                                >
                                                    <Minus className="h-5 w-5 stroke-[3px]" />
                                                </button>

                                                <span className="text-lg font-black text-orange-500 min-w-[2rem] text-center">
                                                    {qtyInCart || 0}
                                                </span>

                                                <button
                                                    onClick={() => onAddToCart(service, 'service')}
                                                    className="h-10 w-10 flex items-center justify-center text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors"
                                                >
                                                    <Plus className="h-5 w-5 stroke-[3px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 text-center animate-fade-in">
                                <Wrench className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-gray)] opacity-20" />
                                <h3 className="text-lg font-bold mb-1 uppercase tracking-widest">{t.clear}</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm('')}
                                    className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-[var(--color-text-white)] rounded-full px-8 py-6 font-black uppercase text-xs"
                                >
                                    {t.clear}
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
