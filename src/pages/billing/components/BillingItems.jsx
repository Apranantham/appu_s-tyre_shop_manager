import React, { useState, useCallback, useMemo } from 'react';
import { Search, Package, Wrench, Plus, Minus, X, ArrowLeft, History, Trash2, ScanLine, Star, Activity, Disc, Circle, Wind } from 'lucide-react';
import BarcodeScannerModal, { isBarcodeScanSupported } from '../../../components/common/BarcodeScannerModal';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/ui/Button';
import { useProducts } from '../../../context/ProductContext';
import { useServices } from '../../../context/ServiceContext';
import { useOldItemsMaster } from '../../../context/OldItemContext';
import { useSettings } from '../../../context/SettingsContext';
import { translations } from '../../../utils/translations';
import { FALLBACK_IMAGE, PRODUCT_CATEGORIES } from '../../../utils/constants';
import { matchesQuery, displayNames } from '../../../utils/itemName';
import { useItemStats, rankItems } from '../../../hooks/useItemStats';

// Visual identity per service TYPE (the `icon` field set in the Services page).
// Fixed categorical hues so the types stay distinct whatever accent is chosen.
const SERVICE_META = {
    align: { Icon: Activity, color: '#22D3EE', soft: 'rgba(34, 211, 238, 0.13)', label: 'Alignment', label_ta: 'அலைன்மென்ட்' },
    balance: { Icon: Disc, color: '#A78BFA', soft: 'rgba(167, 139, 250, 0.13)', label: 'Balancing', label_ta: 'பேலன்சிங்' },
    tyre: { Icon: Circle, color: '#FB923C', soft: 'rgba(251, 146, 60, 0.15)', label: 'Tyre Work', label_ta: 'டயர் வேலை' },
    gas: { Icon: Wind, color: '#34D399', soft: 'rgba(52, 211, 153, 0.13)', label: 'Air / Gas', label_ta: 'காற்று / கேஸ்' },
    tool: { Icon: Wrench, color: '#60A5FA', soft: 'rgba(96, 165, 250, 0.13)', label: 'Repair', label_ta: 'பழுது' },
};

const FAV_KEY = 'tyreshop_favorites';

const BillingItems = ({ onAddToCart, onUpdateQuantity, onRemoveItem, cart = [], onBack, editingInvoiceNo }) => {
    const { products } = useProducts();
    const { services } = useServices();
    const { oldItemsMaster } = useOldItemsMaster();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const ta = lang === 'ta';
    const t = translations[lang];
    const stats = useItemStats();

    const [activeTab, setActiveTab] = useState('services');
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [showScanner, setShowScanner] = useState(false);

    // Favorites (⭐) — pinned to the top, device-local like the other prefs.
    const [favorites, setFavorites] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); }
    });
    const toggleFavorite = (key) => setFavorites(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
        return next;
    });

    const switchTab = (tab) => { setActiveTab(tab); setCategory('all'); };

    // Camera scan → add the matching product straight to the cart.
    const handleBarcodeDetected = useCallback((code) => {
        setShowScanner(false);
        const normalized = String(code).trim().toLowerCase();
        const product = products.find(p =>
            (p.isActive !== false) && (p.barcode || '').trim().toLowerCase() === normalized
        );
        if (product) {
            onAddToCart(product, 'product');
            setSearchTerm('');
        } else {
            setActiveTab('products');
            setSearchTerm(String(code));
        }
    }, [products, onAddToCart]);

    // ---- Old parts (unchanged data-entry form) ----
    const newRow = () => ({ id: Date.now() + Math.random(), name: '', qty: 1, exchangeValue: '', scrapValue: '' });
    const [oldPartRows, setOldPartRows] = useState([newRow()]);
    const [focusedRowId, setFocusedRowId] = useState(null);
    const updateRow = useCallback((rowId, field, value) => {
        setOldPartRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
    }, []);
    const addRow = () => setOldPartRows(prev => [...prev, newRow()]);
    const removeRow = (rowId) => setOldPartRows(prev => prev.length > 1 ? prev.filter(r => r.id !== rowId) : [newRow()]);
    const addRowToCart = (row) => {
        if (!row.name || !row.exchangeValue) return;
        const slug = `${row.name}_${row.exchangeValue}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        onAddToCart({
            id: `old_${slug}`, name: row.name, price: 0,
            exchangeValue: Number(row.exchangeValue), scrapValue: Number(row.scrapValue) || 0,
            quantity: Number(row.qty) || 1, type: 'old_part'
        }, 'old_part');
        removeRow(row.id);
    };
    const addAllToCart = () => {
        oldPartRows.forEach(row => { if (row.name && row.exchangeValue) addRowToCart(row); });
        setOldPartRows([newRow()]);
    };

    const getItemQuantity = (id, type) => {
        const item = cart.find(i => i.id === id && i.type === type);
        return item ? item.quantity : 0;
    };

    // ---- Category chips for the active tab ----
    const serviceTypesPresent = useMemo(() => {
        const set = new Set(services.filter(s => s.active !== false).map(s => s.icon || 'tool'));
        return Object.keys(SERVICE_META).filter(k => set.has(k));
    }, [services]);

    const chips = useMemo(() => {
        const base = [
            { id: 'all', label: ta ? 'அனைத்தும்' : 'All' },
            { id: 'fav', label: '★', title: ta ? 'பிடித்தவை' : 'Favorites' },
        ];
        if (activeTab === 'products') {
            return base.concat(
                PRODUCT_CATEGORIES.filter(c => ['car', 'bike', 'truck'].includes(c.id))
                    .map(c => ({ id: c.id, label: ta && c.label_ta ? c.label_ta : c.label }))
            );
        }
        return base.concat(serviceTypesPresent.map(k => ({ id: k, label: ta ? SERVICE_META[k].label_ta : SERVICE_META[k].label })));
    }, [activeTab, serviceTypesPresent, ta]);

    // ---- Filtered + ranked lists ----
    const visibleProducts = useMemo(() => {
        let list = products.filter(p => p.isActive !== false && matchesQuery(p, searchTerm, ['size', 'brand', 'barcode']));
        if (category === 'fav') list = list.filter(p => favorites.has(`product:${p.id}`));
        else if (['car', 'bike', 'truck'].includes(category)) list = list.filter(p => p.category === category);
        return rankItems(list, 'product', stats, favorites);
    }, [products, searchTerm, category, favorites, stats]);

    const visibleServices = useMemo(() => {
        let list = services.filter(s => s.active !== false && matchesQuery(s, searchTerm));
        if (category === 'fav') list = list.filter(s => favorites.has(`service:${s.id}`));
        else if (SERVICE_META[category]) list = list.filter(s => (s.icon || 'tool') === category);
        return rankItems(list, 'service', stats, favorites);
    }, [services, searchTerm, category, favorites, stats]);

    // ---- Compact row ----
    const ItemRow = ({ item, type }) => {
        const qty = getItemQuantity(item.id, type);
        const favKey = `${type}:${item.id}`;
        const fav = favorites.has(favKey);
        const { primary, secondary } = displayNames(item);
        const meta = type === 'service' ? (SERVICE_META[item.icon] || SERVICE_META.tool) : null;
        const outOfStock = type === 'product' && !(item.stock > 0);
        const inCart = qty > 0;

        return (
            <div
                onClick={() => { if (!outOfStock) onAddToCart(item, type); }}
                className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-card border transition-colors select-none',
                    inCart ? 'border-primary/50 bg-primary-soft'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-dark)]/40 active:bg-[var(--color-bg-dark)]/70',
                    outOfStock ? 'opacity-45' : 'cursor-pointer'
                )}
            >
                {/* Thumb / type icon */}
                {type === 'product' ? (
                    <div className="h-11 w-11 shrink-0 rounded-control overflow-hidden bg-[var(--color-bg-dark)] border border-[var(--color-border)]">
                        <img src={item.image || FALLBACK_IMAGE} alt="" className="h-full w-full object-cover" />
                    </div>
                ) : (
                    <div className="h-11 w-11 shrink-0 rounded-control flex items-center justify-center border border-white/5"
                        style={{ backgroundColor: meta.soft, color: meta.color }}>
                        <meta.Icon className="h-5 w-5" />
                    </div>
                )}

                {/* Names + meta */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[var(--color-text-white)] leading-tight truncate">{primary}</p>
                    {secondary && <p className="text-[11px] text-[var(--color-text-gray)] leading-tight truncate">{secondary}</p>}
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {type === 'product' && item.size && (
                            <span className="text-[10px] font-bold text-[var(--color-text-gray)]">{item.size}</span>
                        )}
                        {type === 'product' && (
                            <span className={cn('text-[10px] font-black uppercase tracking-wide', outOfStock ? 'text-danger' : 'text-success')}>
                                {outOfStock ? (t.out_of_stock || 'Out') : `${t.in_stock || 'Stock'} ${item.stock}`}
                            </span>
                        )}
                        {type === 'service' && (
                            <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: meta.color }}>
                                {ta ? meta.label_ta : meta.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Price */}
                <span className="font-black text-sm text-[var(--color-text-white)] tabular-nums shrink-0">₹{Number(item.price || 0).toLocaleString('en-IN')}</span>

                {/* Favorite */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(favKey); }}
                    className={cn('h-9 w-9 shrink-0 flex items-center justify-center rounded-control transition-colors',
                        fav ? 'text-warning' : 'text-[var(--color-text-gray)]/40 hover:text-[var(--color-text-gray)]')}
                    title={ta ? 'பிடித்தது' : 'Favorite'}
                >
                    <Star className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} />
                </button>

                {/* Stepper (only when in cart) or add hint */}
                {inCart ? (
                    <div className="flex items-center gap-1 shrink-0 bg-[var(--color-bg-card)] rounded-control p-0.5 border border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => qty > 1 ? onUpdateQuantity(item.id, type, -1) : onRemoveItem(item.id, type)}
                            className="h-9 w-9 flex items-center justify-center rounded-[10px] text-[var(--color-text-white)] hover:bg-[var(--color-bg-dark)]"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-black text-sm tabular-nums">{qty}</span>
                        <button
                            onClick={() => onAddToCart(item, type)}
                            disabled={outOfStock}
                            className="h-9 w-9 flex items-center justify-center rounded-[10px] bg-primary text-white disabled:opacity-30"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className={cn('h-9 w-9 shrink-0 flex items-center justify-center rounded-control',
                        outOfStock ? 'text-[var(--color-text-gray)]/30' : 'bg-primary/15 text-primary')}>
                        <Plus className="h-5 w-5" />
                    </div>
                )}
            </div>
        );
    };

    const list = activeTab === 'products' ? visibleProducts : visibleServices;
    const emptyLabel = activeTab === 'products'
        ? (ta ? 'பொருட்கள் இல்லை' : 'No products found')
        : (ta ? 'சேவைகள் இல்லை' : 'No services found');

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl md:mr-4 overflow-hidden w-full max-w-full">
            {/* Sticky header: exit + tabs + search + chips */}
            <div className="shrink-0 border-b border-[var(--color-border)]">
                {onBack && (
                    <div className="flex items-center justify-between px-4 py-3">
                        <button onClick={onBack} className="flex items-center gap-2 text-[var(--color-text-gray)] hover:text-primary transition-colors group">
                            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">{t.exit || 'Exit'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <h2 className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-gray)] uppercase">
                                {editingInvoiceNo ? (ta ? `திருத்துதல் #${editingInvoiceNo}` : `EDITING #${editingInvoiceNo}`) : (t.billing_mode || 'BILLING')}
                            </h2>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1.5 px-3 pt-1">
                    {[
                        { id: 'services', label: t.services_tab, Icon: Wrench },
                        { id: 'products', label: t.products, Icon: Package },
                        { id: 'old_parts', label: t.old_parts, Icon: History },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => switchTab(tab.id)}
                            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-control text-xs font-black uppercase tracking-wide transition-colors',
                                activeTab === tab.id ? 'bg-primary text-white' : 'text-[var(--color-text-gray)] hover:bg-[var(--color-bg-dark)]/60')}
                        >
                            <tab.Icon className="h-4 w-4" />
                            <span className="hidden xs:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab !== 'old_parts' && (
                    <div className="px-3 py-3 space-y-2.5">
                        {/* Search + scan */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={ta ? 'தமிழ் அல்லது English பெயர் தேடு...' : 'Search name (Tamil or English)...'}
                                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-control pl-10 pr-9 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {activeTab === 'products' && isBarcodeScanSupported() && (
                                <button onClick={() => setShowScanner(true)} className="shrink-0 px-3.5 rounded-control bg-primary text-white flex items-center active:scale-95 transition-transform" title={ta ? 'ஸ்கேன்' : 'Scan'}>
                                    <ScanLine className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Category chips */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                            {chips.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setCategory(c.id)}
                                    title={c.title}
                                    className={cn('shrink-0 px-3.5 py-1.5 rounded-pill text-[11px] font-black uppercase tracking-wide border transition-colors',
                                        category === c.id ? 'bg-primary text-white border-primary'
                                            : 'bg-[var(--color-bg-dark)]/40 text-[var(--color-text-gray)] border-[var(--color-border)]')}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable list (or old-parts form) */}
            {activeTab === 'old_parts' ? (
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="bg-[var(--color-bg-dark)]/60 border border-[var(--color-border)] p-3 rounded-card space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">{t.old_parts}</h3>
                            </div>
                            <button onClick={addRow} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-control active:scale-95">
                                <Plus className="h-3.5 w-3.5" /> {ta ? 'வரிசை' : 'Add Row'}
                            </button>
                        </div>
                        {oldPartRows.map((row, index) => (
                            <div key={row.id} className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-card p-3 space-y-3">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{ta ? 'பாகம்' : 'Part'} {index + 1}</span>
                                <div className="relative">
                                    <input
                                        value={row.name}
                                        onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                        onFocus={() => setFocusedRowId(row.id)}
                                        onBlur={() => setTimeout(() => setFocusedRowId(cur => cur === row.id ? null : cur), 200)}
                                        placeholder={ta ? 'பொருள் பெயர்...' : 'Item name...'}
                                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-control px-3 py-2.5 text-sm font-bold focus:border-primary outline-none"
                                    />
                                    {focusedRowId === row.id && oldItemsMaster.length > 0 && (
                                        <div className="absolute left-0 right-0 top-[105%] bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-control shadow-2xl overflow-hidden z-[100] max-h-48 overflow-y-auto">
                                            {oldItemsMaster.filter(it => it.name.toLowerCase().includes((row.name || '').toLowerCase())).map(it => (
                                                <button key={it.id} type="button" onMouseDown={() => { updateRow(row.id, 'name', it.name); setFocusedRowId(null); }}
                                                    className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-primary hover:text-white transition-colors border-b border-[var(--color-border)]/50 last:border-none">
                                                    {it.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)] block mb-1">{ta ? 'எண்' : 'Qty'}</label>
                                        <input type="number" inputMode="decimal" min="1" value={row.qty} onFocus={(e) => e.target.select()} onChange={(e) => updateRow(row.id, 'qty', e.target.value)}
                                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-control px-2 py-2.5 text-sm font-bold text-center outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)] block mb-1">{ta ? 'மாற்று ₹' : 'Exchange ₹'}</label>
                                        <input type="number" inputMode="decimal" value={row.exchangeValue} onFocus={(e) => e.target.select()} onChange={(e) => updateRow(row.id, 'exchangeValue', e.target.value)} placeholder="0"
                                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-control px-2 py-2.5 text-sm font-bold text-right text-danger outline-none focus:border-danger" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)] block mb-1">{ta ? 'ஸ்கிராப் ₹' : 'Scrap ₹'}</label>
                                        <input type="number" inputMode="decimal" value={row.scrapValue} onFocus={(e) => e.target.select()} onChange={(e) => updateRow(row.id, 'scrapValue', e.target.value)} placeholder="0"
                                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-control px-2 py-2.5 text-sm font-bold text-right outline-none focus:border-primary" />
                                    </div>
                                </div>
                                <button onClick={() => removeRow(row.id)} className="w-full h-9 flex items-center justify-center gap-2 rounded-control bg-danger-soft text-danger text-[11px] font-black uppercase tracking-widest active:scale-95">
                                    <Trash2 className="h-4 w-4" /> {ta ? 'நீக்கு' : 'Remove'}
                                </button>
                            </div>
                        ))}
                        <Button onClick={addAllToCart} disabled={!oldPartRows.some(r => r.name && r.exchangeValue)} className="w-full rounded-control py-3 font-black uppercase text-xs tracking-widest disabled:opacity-30">
                            {t.add_old_part || 'Add All to Bill'}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-3 pt-3 pb-28 md:pb-6 space-y-2">
                    {list.length === 0 ? (
                        <div className="py-16 text-center">
                            <Package className="h-12 w-12 mx-auto mb-3 text-[var(--color-text-gray)] opacity-20" />
                            <p className="text-sm font-bold text-[var(--color-text-gray)]">{emptyLabel}</p>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="mt-3 text-primary text-xs font-black uppercase tracking-widest">
                                    {t.clear || 'Clear'}
                                </button>
                            )}
                        </div>
                    ) : (
                        list.map(item => <ItemRow key={`${activeTab}-${item.id}`} item={item} type={activeTab === 'products' ? 'product' : 'service'} />)
                    )}
                </div>
            )}

            <BarcodeScannerModal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onDetect={handleBarcodeDetected}
                title={ta ? 'பார்கோடு ஸ்கேன்' : 'Scan barcode'}
            />
        </div>
    );
};

export default BillingItems;
