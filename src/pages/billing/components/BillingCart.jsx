import React from 'react';
import { Trash2, Plus, Minus, User, Phone, Car, CreditCard, Banknote, QrCode, Calendar, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const BillingCart = ({
    cart,
    customer,
    onUpdateCustomer,
    onUpdateQuantity,
    onRemoveItem,
    onCheckout,
    paymentMode,
    setPaymentMode,
    discount,
    setDiscount,
    billingDate,
    setBillingDate
}) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = 0; // No tax as requested
    const total = subtotal - (Number(discount) || 0);

    const paymentModes = [
        { id: 'cash', label: 'Cash', icon: Banknote },
        { id: 'card', label: 'Card', icon: CreditCard },
        { id: 'upi', label: 'UPI', icon: QrCode },
    ];

    return (
        <Card className="min-h-full lg:h-full flex flex-col bg-[var(--color-bg-card)] border-l border-[var(--color-border)] rounded-none md:rounded-xl">
            <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-bg-dark)]/20">
                <h2 className="text-sm font-bold flex items-center text-[var(--color-primary)]">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Current Bill
                </h2>
            </div>

            <div className="p-3 space-y-3">
                {/* Customer Details */}
                <div className="space-y-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-wider ml-0.5">Customer Name</label>
                        <input
                            placeholder="Name"
                            value={customer.name}
                            onChange={(e) => onUpdateCustomer('name', e.target.value)}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder:opacity-30"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-wider ml-0.5">Phone Number</label>
                            <input
                                placeholder="Phone"
                                value={customer.phone}
                                onChange={(e) => onUpdateCustomer('phone', e.target.value)}
                                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder:opacity-30"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-wider ml-0.5">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={billingDate}
                                onChange={(e) => setBillingDate(e.target.value)}
                                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-wider ml-0.5">Vehicle</label>
                        <input
                            placeholder="Vehicle Number / Model"
                            value={customer.vehicle}
                            onChange={(e) => onUpdateCustomer('vehicle', e.target.value)}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder:opacity-30"
                        />
                    </div>
                </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 lg:min-h-0 overflow-y-auto p-2 space-y-2">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-gray)] opacity-50 p-4 text-center">
                        <p className="text-sm font-medium">Cart is empty</p>
                        <p className="text-xs">Select items from the left</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="group flex justify-between items-center bg-[var(--color-bg-dark)]/[0.4] p-2 rounded-lg border border-[var(--color-border)]/50 hover:border-[var(--color-primary)]/30 transition-all">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs truncate text-[var(--color-text-white)]">{item.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-[var(--color-primary)] font-black">₹{item.price}</span>
                                    <span className="text-[9px] text-[var(--color-text-gray)] uppercase tracking-tighter truncate max-w-[80px]">
                                        {item.type === 'service' ? 'Service' : `${item.brand || ''}`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2">
                                <div className="flex items-center bg-[var(--color-bg-card)] rounded-md border border-[var(--color-border)] shadow-sm">
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.type, -1)}
                                        className="p-1 hover:bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] hover:text-white transition-colors"
                                    >
                                        <Minus className="h-2.5 w-2.5" />
                                    </button>
                                    <span className="text-[11px] font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.type, 1)}
                                        className="p-1 hover:bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] hover:text-white transition-colors"
                                    >
                                        <Plus className="h-2.5 w-2.5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemoveItem(item.id, item.type)}
                                    className="text-red-500/50 hover:text-red-500 p-1 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--color-border)] space-y-3 bg-[var(--color-bg-dark)]/10">
                {/* Payment Modes */}
                <div className="grid grid-cols-3 gap-1.5">
                    {paymentModes.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setPaymentMode(mode.id)}
                            className={`flex flex-col items-center justify-center py-1.5 rounded-md border transition-colors ${paymentMode === mode.id
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                : 'bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] border-[var(--color-border)] hover:bg-[var(--color-bg-card)]'
                                }`}
                        >
                            <mode.icon className="h-3.5 w-3.5 mb-0.5" />
                            <span className="text-[9px] font-bold">{mode.label}</span>
                        </button>
                    ))}
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[var(--color-text-gray)]">
                        <span className="text-[10px] font-medium uppercase tracking-tight">Discount</span>
                        <div className="relative w-20">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px]">₹</span>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded px-3 py-0.5 text-right text-[11px] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-base font-black border-t border-[var(--color-border)]/50 pt-1.5">
                        <span className="text-xs uppercase tracking-wide">Total</span>
                        <span className="text-[var(--color-primary)]">₹{total.toFixed(2)}</span>
                    </div>
                </div>

                <Button
                    className="w-full py-4 text-sm font-black uppercase tracking-widest bg-[#3B82F6] hover:bg-blue-600 shadow-md shadow-blue-500/10 rounded-lg"
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                >
                    Complete Payment
                </Button>
            </div>
        </Card>
    );
};

export default BillingCart;
