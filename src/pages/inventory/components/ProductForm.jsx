import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES, TYRE_TYPES, PRODUCT_UNITS } from '../../../utils/constants';

const inputCls = "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

const ProductForm = ({ onSubmit, initialData, onCancel, canEditPrice = true, saving = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        nameAlt: '',
        brand: '',
        productType: 'general',
        // tyre-only
        size: '',
        pattern: '',
        loadIndex: '',
        tubeType: 'tubeless',
        manufactureYear: '',
        category: '',
        // generic
        unit: 'pcs',
        costPrice: '',
        price: '',
        stock: '',
        minStock: 5,
        gstRate: '',
        hsn: '',
        description: '',
        barcode: '',
        image: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => {
                const merged = { ...prev, ...initialData };
                // Older products predate productType — infer 'tyre' when they
                // carry tyre data so their size/spec fields still show on edit.
                if (!initialData.productType) {
                    merged.productType = (initialData.size || ['car', 'bike', 'truck'].includes(initialData.category)) ? 'tyre' : 'general';
                }
                return merged;
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isTyre = TYRE_TYPES.includes(formData.productType);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Blank stock => untracked (null): the item is always sellable and never
        // decremented. A number => tracked as before.
        const trackStock = formData.stock !== '' && formData.stock !== null && formData.stock !== undefined;
        onSubmit({
            ...formData,
            price: Number(formData.price),
            costPrice: Number(formData.costPrice) || 0,
            stock: trackStock ? Number(formData.stock) : null,
            minStock: Number(formData.minStock) || 5,
            gstRate: formData.gstRate === '' ? null : Number(formData.gstRate),
            barcode: (formData.barcode || '').trim(),
        });
    };

    const costNum = Number(formData.costPrice) || 0;
    const priceNum = Number(formData.price) || 0;
    const margin = priceNum - costNum;
    const marginPct = costNum > 0 ? ((margin / costNum) * 100).toFixed(0) : null;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Brand (only Name is required) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Product Name *</label>
                    <input required name="name" value={formData.name} onChange={handleChange} className={inputCls} placeholder="e.g. Michelin Pilot Sport 4" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Brand (optional)</label>
                    <input name="brand" value={formData.brand} onChange={handleChange} className={inputCls} placeholder="e.g. Michelin" />
                </div>
            </div>

            {/* Bilingual name */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Name in other language (optional)</label>
                <input name="nameAlt" value={formData.nameAlt} onChange={handleChange} className={inputCls} placeholder="Tamil ⇄ English — e.g. மிச்செலின் டயர்" />
            </div>

            {/* Product type — drives the conditional tyre section */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Product Type</label>
                <div className="flex flex-wrap gap-2">
                    {PRODUCT_TYPES.map(pt => (
                        <button
                            key={pt.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, productType: pt.id }))}
                            className={cn('px-3.5 py-2 rounded-control text-xs font-bold border transition-colors',
                                formData.productType === pt.id
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] border-[var(--color-border)] hover:text-[var(--color-text-white)]')}
                        >
                            {pt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tyre-specific section — only for tyre / tube */}
            {isTyre && (
                <div className="space-y-4 rounded-card border border-[var(--color-border)] bg-[var(--color-bg-dark)]/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Tyre details</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">Tyre Size</label>
                            <input name="size" value={formData.size} onChange={handleChange} className={inputCls} placeholder="e.g. 245/40 R18" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">Pattern</label>
                            <input name="pattern" value={formData.pattern} onChange={handleChange} className={inputCls} placeholder="e.g. Sport" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">Load/Speed</label>
                            <input name="loadIndex" value={formData.loadIndex} onChange={handleChange} className={inputCls} placeholder="91V" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">Tube Type</label>
                            <select name="tubeType" value={formData.tubeType} onChange={handleChange} className={inputCls}>
                                <option value="tubeless">Tubeless</option>
                                <option value="tube">Tube Type</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">Mfg. Year</label>
                            <input type="number" inputMode="numeric" name="manufactureYear" value={formData.manufactureYear} onChange={handleChange} className={inputCls} placeholder="2025" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-text-gray)]">Vehicle</label>
                        <div className="flex gap-2">
                            {PRODUCT_CATEGORIES.filter(c => ['car', 'bike', 'truck'].includes(c.id)).map(cat => (
                                <button key={cat.id} type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                    className={cn('px-4 py-2 rounded-control text-sm border transition-colors',
                                        formData.category === cat.id
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] border-[var(--color-border)]')}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Unit + prices */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Unit</label>
                    <select name="unit" value={formData.unit} onChange={handleChange} className={inputCls}>
                        {PRODUCT_UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Cost Price (₹)</label>
                    <input type="number" inputMode="decimal" name="costPrice" value={formData.costPrice} onChange={handleChange} className={inputCls} placeholder="What you paid" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Selling Price (₹) *{!canEditPrice && ' — admin'}</label>
                    <input required type="number" inputMode="decimal" name="price" value={formData.price} onChange={handleChange}
                        disabled={!canEditPrice}
                        title={!canEditPrice ? 'Only an admin can change the selling price of an existing product' : undefined}
                        className={cn(inputCls, 'disabled:opacity-50 disabled:cursor-not-allowed')} placeholder="0.00" />
                </div>
            </div>

            {costNum > 0 && priceNum > 0 && (
                <p className={`text-xs font-bold ${margin >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    Margin: ₹{margin.toLocaleString()} per unit{marginPct !== null ? ` (${marginPct}%)` : ''}
                </p>
            )}

            {/* Stock (optional) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Stock (blank = not tracked)</label>
                    <input type="number" inputMode="numeric" name="stock" value={formData.stock} onChange={handleChange} className={inputCls} placeholder="leave blank if untracked" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Low-stock alert</label>
                    <input type="number" inputMode="numeric" name="minStock" value={formData.minStock} onChange={handleChange} className={inputCls} placeholder="5" />
                </div>
            </div>

            {/* GST / HSN (optional, capture only) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">GST % (optional)</label>
                    <input type="number" inputMode="decimal" name="gstRate" value={formData.gstRate} onChange={handleChange} className={inputCls} placeholder="e.g. 18" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">HSN code (optional)</label>
                    <input name="hsn" value={formData.hsn} onChange={handleChange} className={cn(inputCls, 'font-mono')} placeholder="e.g. 4011" />
                </div>
            </div>

            {/* Description (optional) */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Description (optional)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={cn(inputCls, 'resize-none')} placeholder="Any notes about this product" />
            </div>

            {/* Barcode */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Barcode (optional)</label>
                <input name="barcode" value={formData.barcode} onChange={handleChange} className={cn(inputCls, 'font-mono')} placeholder="Scan with a USB scanner or type the code" />
            </div>

            {/* Image */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Product Image (optional)</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const img = new Image();
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_WIDTH = 400;
                                let width = img.width, height = img.height;
                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                canvas.width = width; canvas.height = height;
                                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                                setFormData(prev => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.6) }));
                            };
                            img.src = reader.result;
                        };
                        reader.readAsDataURL(file);
                    }}
                    className="w-full text-sm text-[var(--color-text-gray)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-hover)] cursor-pointer"
                />
                {formData.image && (
                    <div className="mt-2 h-32 w-32 rounded-lg overflow-hidden border border-[var(--color-border)] relative group">
                        <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                            className="absolute top-1 right-1 bg-danger text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={saving}>Save Product</Button>
            </div>
        </form>
    );
};

export default ProductForm;
