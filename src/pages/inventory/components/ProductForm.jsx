import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { PRODUCT_CATEGORIES } from '../../../utils/constants';

const ProductForm = ({ onSubmit, initialData, onCancel, canEditPrice = true }) => {
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        size: '',
        pattern: '',
        loadIndex: '',
        tubeType: 'tubeless',
        manufactureYear: '',
        category: 'car',
        costPrice: '',
        price: '',
        stock: '',
        minStock: 5,
        barcode: '',
        image: '',
    });

    useEffect(() => {
        if (initialData) {
            // Merge over defaults — older products won't have the newer fields.
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            price: Number(formData.price),
            costPrice: Number(formData.costPrice) || 0,
            stock: Number(formData.stock),
            minStock: Number(formData.minStock),
            barcode: (formData.barcode || '').trim(),
        });
    };

    const costNum = Number(formData.costPrice) || 0;
    const priceNum = Number(formData.price) || 0;
    const margin = priceNum - costNum;
    const marginPct = costNum > 0 ? ((margin / costNum) * 100).toFixed(0) : null;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Product Name</label>
                    <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="e.g. Michelin Pilot Sport 4"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Brand</label>
                    <input
                        required
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="e.g. Michelin"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Tyre Size</label>
                    <input
                        required
                        name="size"
                        value={formData.size}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="e.g. 245/40 R18"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Pattern</label>
                    <input
                        name="pattern"
                        value={formData.pattern}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="e.g. Sport"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Load/Speed</label>
                    <input
                        name="loadIndex"
                        value={formData.loadIndex}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="e.g. 91V"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Tube Type</label>
                    <select
                        name="tubeType"
                        value={formData.tubeType}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                        <option value="tubeless">Tubeless</option>
                        <option value="tube">Tube Type</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Mfg. Year</label>
                    <input
                        type="number"
                        name="manufactureYear"
                        value={formData.manufactureYear}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="e.g. 2025"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Category</label>
                <div className="flex space-x-2">
                    {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors border ${formData.category === cat.id
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                : 'bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] border-[var(--color-border)] hover:bg-[var(--color-bg-card)]'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Cost Price (₹)</label>
                    <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="What you paid"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">
                        Selling Price (₹){!canEditPrice && ' — admin only'}
                    </label>
                    <input
                        required
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        disabled={!canEditPrice}
                        title={!canEditPrice ? 'Only an admin can change the selling price of an existing product' : undefined}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {costNum > 0 && priceNum > 0 && (
                <p className={`text-xs font-bold ${margin >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    Margin: ₹{margin.toLocaleString()} per unit{marginPct !== null ? ` (${marginPct}%)` : ''}
                </p>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Stock</label>
                    <input
                        required
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="0"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">Min Alert</label>
                    <input
                        required
                        type="number"
                        name="minStock"
                        value={formData.minStock}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="5"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Barcode</label>
                <input
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm font-mono text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Scan with a USB scanner or type the code (optional)"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Product Image</label>
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const img = new Image();
                                        img.onload = () => {
                                            const canvas = document.createElement('canvas');
                                            const MAX_WIDTH = 400; // Limit resolution
                                            let width = img.width;
                                            let height = img.height;

                                            if (width > MAX_WIDTH) {
                                                height *= MAX_WIDTH / width;
                                                width = MAX_WIDTH;
                                            }

                                            canvas.width = width;
                                            canvas.height = height;
                                            const ctx = canvas.getContext('2d');
                                            ctx.drawImage(img, 0, 0, width, height);

                                            // Compress significantly to stay under Firestore 1MB limit
                                            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                            setFormData(prev => ({ ...prev, image: dataUrl }));
                                        };
                                        img.src = reader.result;
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="w-full text-sm text-[var(--color-text-gray)]
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-[var(--color-primary)] file:text-white
                            hover:file:bg-[var(--color-primary-hover)]
                            cursor-pointer"
                        />
                    </div>
                </div>
                {formData.image && (
                    <div className="mt-2 h-32 w-32 rounded-lg overflow-hidden border border-[var(--color-border)] relative group">
                        <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                            className="absolute top-1 right-1 bg-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">Save Product</Button>
            </div>
        </form>
    );
};

export default ProductForm;
