import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, User, Phone, Car, CreditCard, Banknote, QrCode, Calendar, FileText, CheckCircle2, Clock, Search, ShoppingCart, ArrowLeft, Coins, Wallet, History, Send, PauseCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useSettings } from '../../../context/SettingsContext';
import { useInvoices } from '../../../context/InvoiceContext';
import { translations } from '../../../utils/translations';

const BillingCart = ({
    cart,
    customer,
    onUpdateCustomer,
    onUpdateQuantity,
    onSetQuantity,
    onUpdatePrice,
    onRemoveItem,
    onCheckout,
    onHold,
    isSubmitting = false,
    paymentMode,
    setPaymentMode,
    discount,
    setDiscount,
    billingDate,
    setBillingDate,
    paymentStatus = 'paid',
    setPaymentStatus,
    paidAmount = 0,
    setPaidAmount,
    paymentNote = '',
    setPaymentNote,
    onToggleView,
    editingInvoiceNo
}) => {
    const { shopDetails } = useSettings();
    const { invoices } = useInvoices();
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredHistory = useMemo(() => {
        if (!customer.name) return [];

        // Get unique customers from invoices
        const customers = Object.values(invoices.reduce((acc, inv) => {
            const key = inv.customer?.phone || inv.customer?.name;
            if (key && (!acc[key] || new Date(inv.date) > new Date(acc[key].date))) {
                acc[key] = inv.customer;
            }
            return acc;
        }, {}));

        return customers.filter(c =>
            c.name.toLowerCase().includes(customer.name.toLowerCase()) ||
            (c.phone && c.phone.includes(customer.name))
        ).slice(0, 5); // Limit to 5 suggestions
    }, [customer.name, invoices]);

    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const subtotal = cart.reduce((sum, item) => {
        if (item.type === 'old_part') return sum - ((item.exchangeValue || 0) * item.quantity);
        return sum + (item.price * item.quantity);
    }, 0);
    // Clamp the discount so the total can never go negative.
    const discountVal = Math.min(Math.max(0, Number(discount) || 0), Math.max(0, subtotal));
    const total = subtotal - discountVal;

    const paymentModes = [
        { id: 'cash', label: t.cash, icon: Banknote },
        { id: 'card', label: t.card, icon: CreditCard },
        { id: 'upi', label: t.upi, icon: QrCode },
    ];

    const paymentStatuses = [
        { id: 'paid', label: t.full_paid, color: 'bg-success' },
        { id: 'partially_paid', label: t.partial_paid, color: 'bg-primary' },
        { id: 'pending', label: t.pay_later, color: 'bg-primary' },
    ];

    return (
        <Card className="h-full flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-none md:rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] relative z-10">
                <button
                    onClick={onToggleView}
                    className="p-2 hover:bg-[var(--color-bg-dark)]/50 rounded-full transition-colors text-[var(--color-text-gray)]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-[11px] font-black tracking-[0.1em] text-[var(--color-text-gray)] uppercase">
                    {editingInvoiceNo ? (lang === 'ta' ? `திருத்துதல் #${editingInvoiceNo}` : `EDITING BILL #${editingInvoiceNo}`) : (t.items_services || 'ITEMS & SERVICES')}
                </h2>
                <button
                    onClick={onToggleView}
                    className="flex items-center gap-1.5 text-primary hover:text-primary-hover transition-colors"
                >
                    <Plus className="h-4 w-4 bg-primary text-white rounded-full p-0.5" />
                    <span className="text-xs font-bold">{t.add_item || 'Add Item'}</span>
                </button>
            </div>

            {/* Scrollable Content: Customer Info & Line Items & Payment Settings */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--color-bg-card)]">
                <div className="p-6 space-y-8">
                    {/* Customer Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <User className="h-4 w-4" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">{t.customer_info || 'Customer Information'}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5 relative">
                                <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest ml-1">{t.name}</label>
                                <div className="relative group/input">
                                    <input
                                        placeholder={t.name_placeholder || "Enter customer name"}
                                        value={customer.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            onUpdateCustomer('name', val);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[var(--color-text-white)] shadow-sm"
                                    />
                                    {showSuggestions && customer.name && filteredHistory.length > 0 && (
                                        <>
                                            <div className="fixed inset-0 z-[60]" onClick={() => setShowSuggestions(false)}></div>
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden z-[70] animate-in fade-in slide-in-from-top-2 duration-200 lg:max-h-60 overflow-y-auto custom-scrollbar">
                                                <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-bg-dark)]/50">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)] px-2">Existing Customers</p>
                                                </div>
                                                {filteredHistory.map((cust, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            onUpdateCustomer('name', cust.name);
                                                            onUpdateCustomer('phone', cust.phone);
                                                            onUpdateCustomer('vehicle', cust.vehicle);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-primary-hover/10 transition-colors flex items-center justify-between border-b border-[var(--color-border)]/50 last:border-none"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-sm text-[var(--color-text-white)]">{cust.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-[var(--color-text-gray)] flex items-center gap-1">
                                                                    <Phone className="h-2.5 w-2.5" /> {cust.phone}
                                                                </span>
                                                                {cust.vehicle && (
                                                                    <span className="text-[10px] text-[var(--color-text-gray)] flex items-center gap-1 uppercase">
                                                                        <Car className="h-2.5 w-2.5" /> {cust.vehicle}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <History className="h-4 w-4 text-[var(--color-text-gray)]/30" />
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest ml-1">{t.phone}</label>
                                <div className="relative flex items-center group/input">
                                    <div className="absolute left-4 text-xs font-black text-primary/60 pointer-events-none">
                                        +91
                                    </div>
                                    <input
                                        placeholder="00000 00000"
                                        value={customer.phone}
                                        onChange={(e) => onUpdateCustomer('phone', e.target.value)}
                                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl pl-12 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[var(--color-text-white)] shadow-sm"
                                    />
                                </div>
                            </div>


                            <div className="space-y-1.5 text-primary">
                                <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest ml-1">{t.date || 'DATE'}</label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={billingDate}
                                        onChange={(e) => setBillingDate(e.target.value)}
                                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[var(--color-text-white)] shadow-sm appearance-none"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)] opacity-50 pointer-events-none" />
                                </div>
                            </div>

                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest ml-1">{t.vehicle}</label>
                                <input
                                    placeholder="KA-01-AB-1234"
                                    value={customer.vehicle}
                                    onChange={(e) => onUpdateCustomer('vehicle', e.target.value)}
                                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[var(--color-text-white)] shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            {cart.length === 0 ? (
                                <div className="py-12 text-center bg-[var(--color-bg-dark)]/20 rounded-2xl border-2 border-dashed border-[var(--color-border)]/50 text-[var(--color-text-gray)]/40">
                                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t.cart_empty}</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={`${item.type}-${item.id}`} className="relative bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm transition-all group overflow-visible">
                                        <button
                                            onClick={() => onRemoveItem(item.id, item.type)}
                                            className="absolute -top-3 -left-3 h-8 w-8 bg-[var(--color-danger)] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10 border-4 border-[var(--color-bg-card)]"
                                        >
                                            <X className="h-4 w-4 stroke-[3px]" />
                                        </button>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="font-black text-lg text-[var(--color-text-white)] leading-tight mb-1">{item.name}</h4>
                                                <p className="text-xs font-bold text-[var(--color-text-gray)]/60 uppercase tracking-wider">
                                                    {item.type === 'old_part' ? (t.exchange_value || 'Exchange/Deduction') : item.type === 'service' ? (t.service_tab || 'Service') : (t.part || 'Part')} • {item.type === 'old_part' ? '' : (item.size || (item.type === 'service' ? 'Maintenance' : 'General'))}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {item.type === 'old_part' ? (
                                                    <span className="font-black text-xl text-danger">-₹{(item.exchangeValue || 0).toLocaleString()}</span>
                                                ) : (
                                                    /* Editable unit price — counter staff negotiate per tyre */
                                                    <div className="flex items-center justify-end">
                                                        <span className="font-black text-xl text-[var(--color-primary)]">₹</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.price}
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={(e) => {
                                                                // Ignore a cleared field — Number('') is 0 and would
                                                                // silently bill the line for free.
                                                                if (e.target.value === '') return;
                                                                const v = Number(e.target.value);
                                                                if (Number.isFinite(v) && onUpdatePrice) onUpdatePrice(item.id, item.type, v);
                                                            }}
                                                            className="w-24 bg-transparent text-right font-black text-xl text-[var(--color-primary)] border-b border-dashed border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none p-0"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between mt-6">
                                            <div className="flex items-center bg-[var(--color-bg-dark)]/50 rounded-full p-1 border border-[var(--color-border)]">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, item.type, -1)}
                                                    className="w-10 h-10 flex items-center justify-center text-[var(--color-text-gray)] hover:text-[var(--color-text-white)] transition-colors"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value, 10);
                                                        if (Number.isFinite(v) && onSetQuantity) onSetQuantity(item.id, item.type, v);
                                                    }}
                                                    className="w-12 text-center text-base font-black text-[var(--color-text-white)] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, item.type, 1)}
                                                    className="w-10 h-10 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full shadow-md hover:bg-primary-hover transition-all hover:scale-105"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-[var(--color-text-gray)]/60 uppercase tracking-[0.2em] mb-1">{item.type === 'old_part' ? 'DEDUCTION' : 'SUBTOTAL'}</p>
                                                {item.type === 'old_part' ? (
                                                    <p className="text-xl font-black text-danger">-₹{((item.exchangeValue || 0) * item.quantity).toLocaleString()}</p>
                                                ) : (
                                                    <p className="text-xl font-black text-[var(--color-text-white)]">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Billing Summary & Payment (Moved here to save space) */}
                <div className="p-6 bg-[var(--color-bg-dark)]/30 border-t border-[var(--color-border)] space-y-6">
                    {/* Payment Status Selector */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[var(--color-text-gray)]/60">
                            <Coins className="h-4 w-4" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">{t.payment_status}</h3>
                        </div>
                        <div className="flex p-1 bg-[var(--color-bg-dark)]/50 border border-[var(--color-border)] rounded-xl shadow-sm">
                            {paymentStatuses.map((status) => (
                                <button
                                    key={status.id}
                                    onClick={() => {
                                        setPaymentStatus(status.id);
                                        if (status.id === 'paid') setPaidAmount(total);
                                        if (status.id === 'pending') setPaidAmount(0);
                                    }}
                                    className={cn(
                                        "flex-1 py-3 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all",
                                        paymentStatus === status.id
                                            ? "bg-primary text-white shadow-lg shadow-black/25"
                                            : "text-[var(--color-text-gray)]/60 hover:text-[var(--color-text-white)]"
                                    )}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[var(--color-text-gray)]/60">
                            <Wallet className="h-4 w-4" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">{t.payment_mode}</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {paymentModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setPaymentMode(mode.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-3 rounded-xl border transition-all h-16",
                                        paymentMode === mode.id
                                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm"
                                            : "border-[var(--color-border)] bg-[var(--color-bg-dark)]/50 text-[var(--color-text-gray)]/60 hover:border-[var(--color-text-gray)]/40 hover:text-[var(--color-text-white)]"
                                    )}
                                >
                                    <mode.icon className="h-5 w-5 mb-1.5" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Partially Paid Input */}
                    {paymentStatus === 'partially_paid' && (
                        <div className="p-4 bg-warning-soft rounded-2xl border border-warning/20 flex justify-between items-center shadow-sm">
                            <span className="text-[11px] font-black uppercase text-warning tracking-widest">{t.amount_paid}</span>
                            <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-warning">₹</span>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                    className="w-full bg-[var(--color-bg-card)] border border-warning/30 rounded-xl px-3 pl-7 py-2 text-right text-base font-black text-warning focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                />
                            </div>
                        </div>
                    )}

                    {/* Simple Payment Note / References */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[var(--color-text-gray)]/60">
                            <FileText className="h-4 w-4" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">{t.notes || 'REMARKS'}</h3>
                        </div>
                        <textarea
                            placeholder={t.add_note_placeholder || "Add a transaction note..."}
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                            rows={2}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-[var(--color-text-white)] shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Section (Condensed) */}
            <div className="bg-[var(--color-bg-card)] border-t border-[var(--color-border)] p-4 md:p-6 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] relative z-10">
                <div className="flex flex-col gap-4">
                    {/* Totals Section - Column Wise */}
                    <div className="space-y-3">
                        {/* Subtotal Row */}
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-[var(--color-text-gray)]/60 uppercase tracking-widest">{t.subtotal || 'Subtotal'}</span>
                            <span className="text-base font-black text-[var(--color-text-white)]">₹{subtotal.toLocaleString()}</span>
                        </div>

                        {/* Discount Row - Spacious Input */}
                        <div className="flex justify-between items-center gap-4 bg-[var(--color-bg-dark)]/50 border border-[var(--color-border)] px-4 py-3 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary group shadow-sm">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[9px] font-black text-[var(--color-text-gray)] uppercase tracking-widest">{t.discount || 'DISCOUNT'}</span>
                                <span className="text-xs font-black text-primary">₹</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max={Math.max(0, subtotal)}
                                value={discount}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const v = Math.min(Math.max(0, Number(e.target.value) || 0), Math.max(0, subtotal));
                                    setDiscount(v);
                                }}
                                className="w-full bg-transparent border-none p-0 text-right text-lg font-black focus:outline-none text-[var(--color-text-white)] placeholder:text-[var(--color-text-gray)]/20"
                                placeholder="0"
                            />
                        </div>

                        {/* Grand Total Row */}
                        <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]/50">
                            <span className="text-[11px] font-black text-[var(--color-text-white)] uppercase tracking-widest opacity-40">{t.total_amount || 'TOTAL AMOUNT'}</span>
                            <span className="text-3xl font-black text-[var(--color-primary)] leading-none">₹{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                    {/* Hold: park this bill and start a fresh one (not shown while editing) */}
                    {onHold && cart.length > 0 && !editingInvoiceNo && (
                        <Button
                            variant="outline"
                            onClick={onHold}
                            className="h-14 px-4 rounded-2xl border-[var(--color-warning)]/40 text-[var(--color-warning)] hover:bg-[var(--color-warning-soft)] flex items-center gap-2 shrink-0 active:scale-[0.98] transition-all"
                        >
                            <PauseCircle className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.hold_bill || 'Hold'}</span>
                        </Button>
                    )}
                    <Button
                        className="flex-1 h-14 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-2xl shadow-[0_10px_20px_rgba(255,122,47,0.25)] active:scale-[0.98] transition-all flex flex-row items-center justify-center gap-3 border-none"
                        onClick={onCheckout}
                        isLoading={isSubmitting}
                        disabled={cart.length === 0}
                    >
                        <span className="text-base font-black uppercase tracking-widest">
                            {isSubmitting ? (t.saving || 'SAVING…') : (t.done || 'DONE')}
                        </span>
                        {!isSubmitting && (
                            <>
                                <div className="h-6 w-[1px] bg-white/20" />
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-90">
                                    {paymentStatuses.find(s => s.id === paymentStatus)?.label} • {paymentModes.find(m => m.id === paymentMode)?.label}
                                </span>
                            </>
                        )}
                    </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default BillingCart;
