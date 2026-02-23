import React, { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, AlertTriangle, Package, Eye, EyeOff } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import ProductForm from './components/ProductForm';
import { PRODUCT_CATEGORIES, FALLBACK_IMAGE } from '../../utils/constants';
import { ProductCardSkeleton } from '../../components/ui/SkeletonVariants';

const InventoryPage = () => {
    const location = useLocation();
    const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
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
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-[var(--color-text-gray)]">Manage your tyres and stock levels</p>
                </div>
                <Button onClick={openAddModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-[var(--color-bg-card)] p-4 rounded-xl border border-[var(--color-border)] mt-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                    <input
                        type="text"
                        placeholder="Search by name, brand, size..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-white)]"
                    />
                </div>
                <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {PRODUCT_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === cat.id
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'text-[var(--color-text-gray)] hover:bg-[var(--color-bg-dark)] hover:text-[var(--color-text-white)]'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {loading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : (
                    filteredProducts.map((product) => (
                        <Card key={product.id} className={cn(
                            "group hover:border-[var(--color-primary)] transition-all duration-200",
                            product.isActive === false && "opacity-60 saturate-50"
                        )}>
                            <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-[var(--color-bg-dark)]">
                                <img
                                    src={product.image || FALLBACK_IMAGE}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    onError={(e) => {
                                        console.warn(`Image failed for ${product.name}, falling back.`);
                                        e.target.src = FALLBACK_IMAGE;
                                    }}
                                />
                                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-white hover:bg-slate-200/20"
                                        onClick={(e) => { e.stopPropagation(); updateProduct(product.id, { isActive: !product.isActive }); }}
                                        title={product.isActive === false ? "Enable Product" : "Disable Product"}
                                    >
                                        {product.isActive === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-slate-200/20" onClick={() => openEditModal(product)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-slate-200/20" onClick={() => setProductToDelete(product)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {product.stock <= product.minStock && product.isActive !== false && (
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Low Stock
                                    </div>
                                )}
                                {product.isActive === false && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3 z-10 transition-all">
                                        <span className="bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                                            Disabled
                                        </span>
                                        <Button
                                            size="sm"
                                            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold h-8 px-4 rounded-full shadow-lg"
                                            onClick={(e) => { e.stopPropagation(); updateProduct(product.id, { isActive: true }); }}
                                        >
                                            Enable Product
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                                        <p className="text-sm text-[var(--color-text-gray)]">{product.brand}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[var(--color-primary)]">₹{product.price.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="px-2 py-1 rounded bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-xs font-mono">
                                        {product.size}
                                    </span>
                                    <span className="px-2 py-1 rounded bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-xs font-mono">
                                        {product.pattern}
                                    </span>
                                </div>

                                <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)] mt-2">
                                    <div className="flex items-center text-sm text-[var(--color-text-gray)]">
                                        <Package className="h-4 w-4 mr-2" />
                                        Stock: <span className={`font-bold ml-1 ${product.stock <= product.minStock ? 'text-red-500' : 'text-green-500'}`}>{product.stock}</span>
                                    </div>
                                    <div className="text-xs text-[var(--color-text-gray)] uppercase tracking-wider">
                                        {product.category}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
                {!loading && filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-[var(--color-text-gray)]">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No products found</p>
                        <Button variant="link" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>Clear filters</Button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
            >
                <ProductForm
                    initialData={editingProduct}
                    onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            {productToDelete && (
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
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
