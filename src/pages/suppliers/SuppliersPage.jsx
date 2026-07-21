import React, { useMemo, useState } from 'react';
import {
    Truck,
    Plus,
    Phone,
    ChevronDown,
    PackagePlus,
    Edit2,
    Wallet,
    Banknote,
    ScrollText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProcurement } from '../../context/ProcurementContext';
import { useProducts } from '../../context/ProductContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn';
import { formatMoney as fmt, toInputDate } from '../../utils/format';
import Modal from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

const inputCls = "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

const STATUS_STYLE = {
    paid: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    partially_paid: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    pending: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
};

const SuppliersPage = () => {
    const navigate = useNavigate();
    const { suppliers, purchases, payables, loading, addSupplier, updateSupplier, addPurchase, settlePurchase } = useProcurement();
    const { products } = useProducts();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const ta = lang === 'ta';

    const [expandedId, setExpandedId] = useState(null);
    const [supplierModal, setSupplierModal] = useState(null);   // { id?, name, phone, notes }
    const [purchaseModal, setPurchaseModal] = useState(null);   // { supplierId, date, lines, paidAmount, paymentMode }
    const [settleModal, setSettleModal] = useState(null);       // { purchase, amount, mode }
    const [saving, setSaving] = useState(false);

    const totalPayable = useMemo(
        () => purchases.reduce((s, p) => s + (p.balanceAmount || 0), 0),
        [purchases]
    );
    const purchasesBySupplier = useMemo(() => {
        const map = {};
        purchases.forEach(p => {
            const key = p.supplierId || p.supplierName || 'unknown';
            (map[key] = map[key] || []).push(p);
        });
        return map;
    }, [purchases]);

    const openNewPurchase = (supplierId = '') => setPurchaseModal({
        supplierId,
        // Local date, not toISOString() — UTC would show yesterday before 5:30am IST.
        date: toInputDate(),
        lines: [{ productId: '', qty: '', unitCost: '' }],
        paidAmount: '',
        paymentMode: 'cash'
    });

    const purchaseTotal = purchaseModal
        ? purchaseModal.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0)
        : 0;

    const setLine = (idx, field, value) => {
        setPurchaseModal(prev => {
            const lines = prev.lines.map((l, i) => {
                if (i !== idx) return l;
                const next = { ...l, [field]: value };
                // Prefill unit cost from the product's last cost.
                if (field === 'productId') {
                    const prod = products.find(p => p.id === value);
                    if (prod && !l.unitCost) next.unitCost = prod.costPrice || '';
                }
                return next;
            });
            return { ...prev, lines };
        });
    };

    const saveSupplier = async (e) => {
        e.preventDefault();
        const { id, ...data } = supplierModal;
        if (!data.name?.trim()) return;
        setSaving(true);
        try {
            if (id) await updateSupplier(id, data);
            else await addSupplier(data);
            setSupplierModal(null);
        } finally { setSaving(false); }
    };

    const savePurchase = async () => {
        const supplier = suppliers.find(s => s.id === purchaseModal.supplierId);
        if (!supplier) { alert(ta ? 'சப்ளையரைத் தேர்வு செய்யவும்' : 'Select a supplier'); return; }
        const hasLine = purchaseModal.lines.some(l => l.productId && (Number(l.qty) || 0) > 0);
        if (!hasLine) { alert(ta ? 'குறைந்தது ஒரு பொருள் சேர்க்கவும்' : 'Add at least one item'); return; }
        setSaving(true);
        try {
            await addPurchase({
                supplier,
                date: new Date(`${purchaseModal.date}T12:00:00`).toISOString(),
                items: purchaseModal.lines.map(l => ({
                    productId: l.productId,
                    name: products.find(p => p.id === l.productId)?.name || '',
                    qty: Number(l.qty) || 0,
                    unitCost: Number(l.unitCost) || 0
                })),
                paidAmount: Number(purchaseModal.paidAmount) || 0,
                paymentMode: purchaseModal.paymentMode
            });
            setPurchaseModal(null);
        } catch (err) {
            console.error(err);
            alert(ta ? 'சேமிக்க முடியவில்லை' : 'Could not save the purchase');
        } finally { setSaving(false); }
    };

    const doSettle = async () => {
        setSaving(true);
        try {
            await settlePurchase(settleModal.purchase, Number(settleModal.amount) || 0, settleModal.mode);
            setSettleModal(null);
        } finally { setSaving(false); }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 pb-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <Truck className="h-6 w-6 text-[var(--color-primary)]" />
                        {t.suppliers || 'Suppliers'}
                    </h1>
                    <p className="text-[var(--color-text-gray)] text-sm">{ta ? 'கொள்முதல் மற்றும் கொடுக்க வேண்டிய நிலுவை' : 'Purchases and outstanding payables'}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/inventory/stock-log')}>
                        <ScrollText className="mr-2 h-4 w-4" />
                        {t.stock_log || 'Stock Log'}
                    </Button>
                    <Button variant="outline" onClick={() => setSupplierModal({ name: '', phone: '', notes: '' })}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t.add_supplier || 'Add Supplier'}
                    </Button>
                    <Button onClick={() => openNewPurchase()}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        {t.new_purchase || 'Receive Stock'}
                    </Button>
                </div>
            </div>

            {/* Payable summary */}
            <div className="p-5 rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-control bg-[var(--color-danger-soft)] text-[var(--color-danger)] flex items-center justify-center">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">
                        {ta ? 'மொத்தம் கொடுக்க வேண்டியது' : 'Total payable to suppliers'}
                    </p>
                </div>
                <p className={cn("text-2xl font-black tracking-tight", totalPayable > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-success)]")}>
                    {fmt(totalPayable)}
                </p>
            </div>

            {/* Supplier list */}
            {suppliers.length === 0 ? (
                <div className="py-16 text-center rounded-panel bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border)]">
                    <Truck className="h-12 w-12 mx-auto mb-3 text-[var(--color-text-gray)] opacity-20" />
                    <p className="text-sm font-bold text-[var(--color-text-gray)]">
                        {ta ? 'சப்ளையர்கள் இல்லை — முதலில் ஒருவரைச் சேர்க்கவும்' : 'No suppliers yet — add your first one'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {suppliers.map(s => {
                        const sPurchases = purchasesBySupplier[s.id] || [];
                        const payable = payables[s.id] || 0;
                        const open = expandedId === s.id;
                        return (
                            <div key={s.id} className="rounded-panel bg-[var(--color-bg-card)] border border-[var(--color-border)] overflow-hidden">
                                <button
                                    onClick={() => setExpandedId(open ? null : s.id)}
                                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-[var(--color-bg-dark)]/30 transition-colors"
                                >
                                    <div className="h-11 w-11 rounded-control bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                                        <Truck className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-base text-[var(--color-text)] truncate">{s.name}</p>
                                        <div className="flex items-center gap-4 text-[12px] font-semibold text-[var(--color-text-gray)]">
                                            {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                                            <span>{sPurchases.length} {ta ? 'கொள்முதல்' : 'purchases'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">{ta ? 'நிலுவை' : 'Payable'}</p>
                                        <p className={cn("text-lg font-black", payable > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-success)]")}>{fmt(payable)}</p>
                                    </div>
                                    <ChevronDown className={cn("h-5 w-5 text-[var(--color-text-gray)] transition-transform shrink-0", open && "rotate-180")} />
                                </button>

                                {open && (
                                    <div className="border-t border-[var(--color-border)] p-4 space-y-3 bg-[var(--color-bg-dark)]/20">
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => openNewPurchase(s.id)}>
                                                <PackagePlus className="mr-1.5 h-3.5 w-3.5" /> {t.new_purchase || 'Receive Stock'}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setSupplierModal({ id: s.id, name: s.name, phone: s.phone || '', notes: s.notes || '' })}>
                                                <Edit2 className="mr-1.5 h-3.5 w-3.5" /> {t.edit || 'Edit'}
                                            </Button>
                                        </div>
                                        {sPurchases.length === 0 ? (
                                            <p className="text-xs text-[var(--color-text-gray)]/60 font-semibold py-2">
                                                {ta ? 'இன்னும் கொள்முதல் இல்லை' : 'No purchases recorded yet'}
                                            </p>
                                        ) : sPurchases.map(p => (
                                            <div key={p.id} className="rounded-card bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4">
                                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                                    <div>
                                                        <p className="text-xs font-bold text-[var(--color-text-gray)]">
                                                            {new Date(p.date).toLocaleDateString(ta ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-sm font-black text-[var(--color-text)] mt-0.5">
                                                            {(p.items || []).map(it => `${it.qty}× ${it.name}`).join(', ')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="font-black text-[var(--color-text)]">{fmt(p.total)}</p>
                                                            {p.balanceAmount > 0 && (
                                                                <p className="text-[11px] font-black text-[var(--color-danger)]">
                                                                    {ta ? 'நிலுவை' : 'Due'}: {fmt(p.balanceAmount)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className={cn("px-2.5 py-1 rounded-pill text-[10px] font-black uppercase tracking-wide", STATUS_STYLE[p.status] || STATUS_STYLE.pending)}>
                                                            {p.status === 'paid' ? (ta ? 'செலுத்தியது' : 'Paid') : p.status === 'partially_paid' ? (ta ? 'பகுதி' : 'Partial') : (ta ? 'நிலுவை' : 'Pending')}
                                                        </span>
                                                        {p.balanceAmount > 0 && (
                                                            <button
                                                                onClick={() => setSettleModal({ purchase: p, amount: p.balanceAmount, mode: 'cash' })}
                                                                className="h-9 px-3 rounded-control bg-[var(--color-success)] text-white text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 active:scale-95 transition-transform"
                                                            >
                                                                <Banknote className="h-3.5 w-3.5" /> {ta ? 'செலுத்து' : 'Pay'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / edit supplier */}
            <Modal
                isOpen={!!supplierModal}
                onClose={() => setSupplierModal(null)}
                title={supplierModal?.id ? (ta ? 'சப்ளையர் திருத்து' : 'Edit Supplier') : (t.add_supplier || 'Add Supplier')}
            >
                {supplierModal && (
                    <form onSubmit={saveSupplier} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">{ta ? 'பெயர்' : 'Name'}</label>
                            <input required className={inputCls} value={supplierModal.name}
                                onChange={e => setSupplierModal(m => ({ ...m, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">{ta ? 'போன்' : 'Phone'}</label>
                            <input className={inputCls} value={supplierModal.phone}
                                onChange={e => setSupplierModal(m => ({ ...m, phone: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">{ta ? 'குறிப்பு' : 'Notes'}</label>
                            <input className={inputCls} value={supplierModal.notes}
                                onChange={e => setSupplierModal(m => ({ ...m, notes: e.target.value }))} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setSupplierModal(null)}>{t.cancel || 'Cancel'}</Button>
                            <Button type="submit" isLoading={saving}>{t.save || 'Save'}</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Receive stock */}
            <Modal
                isOpen={!!purchaseModal}
                onClose={() => setPurchaseModal(null)}
                title={t.new_purchase || 'Receive Stock'}
                className="max-w-2xl"
            >
                {purchaseModal && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-gray)]">{t.suppliers || 'Supplier'}</label>
                                <select className={inputCls} value={purchaseModal.supplierId}
                                    onChange={e => setPurchaseModal(m => ({ ...m, supplierId: e.target.value }))}>
                                    <option value="">{ta ? '— தேர்வு —' : '— select —'}</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-gray)]">{ta ? 'தேதி' : 'Date'}</label>
                                <input type="date" className={inputCls} value={purchaseModal.date}
                                    onChange={e => setPurchaseModal(m => ({ ...m, date: e.target.value }))} />
                            </div>
                        </div>

                        {/* Lines */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-gray)]">{t.products || 'Items'}</label>
                            {purchaseModal.lines.map((l, idx) => (
                                <div key={idx} className="grid grid-cols-[2fr_70px_100px] gap-2">
                                    <select className={inputCls} value={l.productId} onChange={e => setLine(idx, 'productId', e.target.value)}>
                                        <option value="">{ta ? '— பொருள் —' : '— product —'}</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} {p.size ? `(${p.size})` : ''}</option>
                                        ))}
                                    </select>
                                    <input type="number" inputMode="decimal" min="1" placeholder={ta ? 'எண்' : 'Qty'} className={inputCls}
                                        value={l.qty} onChange={e => setLine(idx, 'qty', e.target.value)} />
                                    <input type="number" inputMode="decimal" min="0" placeholder={ta ? 'விலை ₹' : 'Cost ₹'} className={inputCls}
                                        value={l.unitCost} onChange={e => setLine(idx, 'unitCost', e.target.value)} />
                                </div>
                            ))}
                            <button
                                onClick={() => setPurchaseModal(m => ({ ...m, lines: [...m.lines, { productId: '', qty: '', unitCost: '' }] }))}
                                className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary)] flex items-center gap-1"
                            >
                                <Plus className="h-3.5 w-3.5" /> {ta ? 'வரிசை சேர்' : 'Add line'}
                            </button>
                        </div>

                        {/* Payment */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-gray)]">
                                    {ta ? 'இப்போது செலுத்தியது' : 'Paid now'} ({ta ? 'மொத்தம்' : 'total'} {fmt(purchaseTotal)})
                                </label>
                                <input type="number" inputMode="decimal" min="0" className={inputCls} value={purchaseModal.paidAmount}
                                    placeholder={ta ? '0 = கடன்' : '0 = on credit'}
                                    onChange={e => setPurchaseModal(m => ({ ...m, paidAmount: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-gray)]">{ta ? 'முறை' : 'Mode'}</label>
                                <select className={inputCls} value={purchaseModal.paymentMode}
                                    onChange={e => setPurchaseModal(m => ({ ...m, paymentMode: e.target.value }))}>
                                    <option value="cash">{t.cash || 'Cash'}</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">{t.card || 'Card'}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setPurchaseModal(null)}>{t.cancel || 'Cancel'}</Button>
                            <Button onClick={savePurchase} isLoading={saving}>
                                {ta ? 'சரக்கு வரவு வை' : 'Receive & Save'} · {fmt(purchaseTotal)}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Settle supplier payment */}
            <Modal
                isOpen={!!settleModal}
                onClose={() => setSettleModal(null)}
                title={ta ? 'சப்ளையருக்கு செலுத்து' : 'Pay Supplier'}
            >
                {settleModal && (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--color-text-gray)]">
                            {settleModal.purchase.supplierName} — {ta ? 'நிலுவை' : 'due'} <strong className="text-[var(--color-danger)]">{fmt(settleModal.purchase.balanceAmount)}</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-gray)]">{ta ? 'தொகை' : 'Amount'}</label>
                                <input type="number" inputMode="decimal" min="0" max={settleModal.purchase.balanceAmount} className={inputCls}
                                    value={settleModal.amount}
                                    onChange={e => setSettleModal(m => ({ ...m, amount: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-gray)]">{ta ? 'முறை' : 'Mode'}</label>
                                <select className={inputCls} value={settleModal.mode}
                                    onChange={e => setSettleModal(m => ({ ...m, mode: e.target.value }))}>
                                    <option value="cash">{t.cash || 'Cash'}</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">{t.card || 'Card'}</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setSettleModal(null)}>{t.cancel || 'Cancel'}</Button>
                            <Button onClick={doSettle} isLoading={saving}>{ta ? 'செலுத்து' : 'Record Payment'}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SuppliersPage;
