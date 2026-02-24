import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Filter, Edit2, Trash2, AlertTriangle, Package, Eye, EyeOff } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import ProductForm from './components/ProductForm';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { PRODUCT_CATEGORIES, FALLBACK_IMAGE } from '../../utils/constants';
import { ProductCardSkeleton } from '../../components/ui/SkeletonVariants';

const InventoryPage = () => {
    const location = useLocation();
    const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const [searchTerm, setSearchTerm] = useState('');

    const [activeCategory, setActiveCategory] = useState(location.state?.filter || 'all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.size.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesCategory = false;
        if (activeCategory === 'all') {
            matchesCategory = true;
        } else if (activeCategory === 'low_stock') {
            matchesCategory = product.stock <= product.minStock;
        } else {
            matchesCategory = product.category === activeCategory;
        }

        return matchesSearch && matchesCategory;
    });

    const handleAddProduct = (data) => {
        addProduct(data);
        setIsModalOpen(false);
    };

    const handleEditProduct = (data) => {
        updateProduct(editingProduct.id, data);
        setEditingProduct(null);
        setIsModalOpen(false);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">{t.inventory}</h1>
                    <p className="text-[var(--color-text-gray)]">{t.real_time_overview}</p>
                </div>
                <Button onClick={openAddModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t.add_product}
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-center bg-[var(--color-bg-card)] p-4 rounded-3xl border border-[var(--color-border)] mt-4 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)] opacity-50" />
                    <input
                        type="text"
                        placeholder={t.search_inventory}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-white)] transition-all"
                    />
                </div>
                <div className="flex space-x-2 overflow-x-auto w-full lg:w-auto pb-4 lg:pb-0 no-scrollbar">
                    {PRODUCT_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                activeCategory === cat.id
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-blue-500/20"
                                    : "bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] border-[var(--color-border)] hover:text-[var(--color-primary)]"
                            )}
                        >
                            {lang === 'ta' && cat.label_ta ? cat.label_ta : cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 mb-10">
                {loading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : (
                    filteredProducts.map((product) => (
                        <Card key={product.id} className={cn(
                            "group border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-all duration-300 shadow-md hover:shadow-xl rounded-[2rem] active:scale-[0.99] overflow-hidden bg-[var(--color-bg-card)]",
                            product.isActive === false && "opacity-60 saturate-50"
                        )}>
                            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-bg-dark)]">
                                <img
                                    src={product.image || FALLBACK_IMAGE}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        console.warn(`Image failed for ${product.name}, falling back.`);
                                        e.target.src = FALLBACK_IMAGE;
                                    }}
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300">
                                    <div className="flex bg-black/60 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-9 w-9 text-white hover:bg-white/20 rounded-xl"
                                            onClick={(e) => { e.stopPropagation(); updateProduct(product.id, { isActive: !product.isActive }); }}
                                            title={product.isActive === false ? "Enable Product" : "Disable Product"}
                                        >
                                            {product.isActive === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-white/20 rounded-xl" onClick={() => openEditModal(product)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500 hover:bg-red-500/20 rounded-xl" onClick={() => setProductToDelete(product)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {product.stock <= product.minStock && product.isActive !== false && (
                                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center shadow-lg border border-red-500/50">
                                        <AlertTriangle className="h-3 w-3 mr-1.5" />
                                        {t.low_stock}
                                    </div>
                                )}
                                {product.isActive === false && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex flex-col items-center justify-center space-y-4 z-10 transition-all">
                                        <span className="bg-black/80 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/20">
                                            {t.disabled}
                                        </span>
                                        <Button
                                            size="sm"
                                            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-black h-10 px-6 rounded-full shadow-lg text-[10px] uppercase tracking-widest"
                                            onClick={(e) => { e.stopPropagation(); updateProduct(product.id, { isActive: true }); }}
                                        >
                                            Enable
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <h3 className="font-black text-xl leading-tight text-[var(--color-text-white)] tracking-tight truncate group-hover:text-[var(--color-primary)] transition-colors">{product.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)] mt-1 opacity-60">{product.brand}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-black text-xl text-[var(--color-primary)]">₹{product.price.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1.5 rounded-xl bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">
                                        {product.size}
                                    </span>
                                    {product.pattern && (
                                        <span className="px-3 py-1.5 rounded-xl bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">
                                            {product.pattern}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)]">
                                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">
                                        <Package className="h-4 w-4 mr-2" />
                                        {t.stock}: <span className={cn(
                                            "ml-1.5 px-2 py-0.5 rounded-lg border",
                                            product.stock <= product.minStock
                                                ? "text-red-500 bg-red-500/10 border-red-500/20"
                                                : "text-green-500 bg-green-500/10 border-green-500/20"
                                        )}>{product.stock}</span>
                                    </div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] bg-[var(--color-bg-dark)] px-2 py-1 rounded-lg">
                                        {product.category}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
                {!loading && filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-[var(--color-bg-card)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)]">
                        <Package className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-gray)] opacity-20" />
                        <h3 className="text-xl font-black text-[var(--color-text-white)] mb-2">{t.no_products_found}</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Try adjusting your filters or search term</p>
                        <Button variant="outline" className="rounded-2xl px-8" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>{t.clear}</Button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? t.edit_product : t.add_product}
            >
                <ProductForm
                    initialData={editingProduct}
                    onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            {productToDelete && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setProductToDelete(null)}></div>
                    <Card className="relative w-full max-w-sm p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Delete Product?</h3>
                            <p className="text-[var(--color-text-gray)] text-sm">
                                This action cannot be undone. Are you sure you want to delete <strong>{productToDelete.name}</strong>?
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" className="flex-1" onClick={() => setProductToDelete(null)}>Cancel</Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => { deleteProduct(productToDelete.id); setProductToDelete(null); }}>Delete</Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
};

export default InventoryPage;
