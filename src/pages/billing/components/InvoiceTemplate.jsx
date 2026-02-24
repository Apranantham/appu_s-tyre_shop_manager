import React from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { Phone, MapPin, Calendar, Clock, Hash, Car, User, CreditCard } from 'lucide-react';

const InvoiceTemplate = React.forwardRef(({ invoice, showPreview = false }, ref) => {
    const { shopDetails } = useSettings();
    if (!invoice) return null;

    // Helper to format ID for a "Reference No" feel
    const formattedId = invoice.invoiceNo
        ? `#${invoice.invoiceNo}`
        : (invoice.id.toString().length > 10
            ? `REF-${invoice.id.toString().slice(-8).toUpperCase()}`
            : `#${invoice.id}`);

    return (
        <div
            ref={ref}
            className={`${showPreview ? 'block' : 'hidden print:block'} p-10 bg-white text-slate-800 min-h-[842px] w-full max-w-[800px] mx-auto shadow-2xl relative font-sans`}
        >
            {/* Design Accent Top */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[var(--color-primary)] to-blue-600 print:bg-[var(--color-primary)]"></div>

            {/* Header Section */}
            <div className="flex justify-between items-start mb-10 pt-4">
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-tight">
                            {shopDetails.shopName.split(' ').map((word, i) => (
                                <span key={i} className={i % 2 === 0 ? "text-slate-900" : "text-[var(--color-primary)]"}>
                                    {word}{' '}
                                </span>
                            ))}
                        </h1>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="h-4 w-4 mr-2 text-[var(--color-primary)] shrink-0" />
                            <span className="whitespace-pre-wrap">{shopDetails.shopAddress}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                            <Phone className="h-4 w-4 mr-2 text-[var(--color-primary)] shrink-0" />
                            <span>{shopDetails.shopPhone}</span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg mb-4">
                        <h2 className="text-lg font-bold tracking-widest uppercase">Invoice</h2>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-end text-sm font-bold text-slate-900">
                            <Hash className="h-3 w-3 mr-1 opacity-50" />
                            <span>{formattedId}</span>
                        </div>
                        <div className="flex items-center justify-end text-xs text-slate-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center justify-end text-xs text-slate-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{new Date(invoice.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center">
                        <User className="h-3 w-3 mr-1" /> Customer Details
                    </p>
                    <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-lg">{invoice.customer.name}</p>
                        <p className="text-sm text-slate-600 font-medium">{invoice.customer.phone}</p>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center">
                        <Car className="h-3 w-3 mr-1" /> Vehicle Info
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-slate-900 text-white rounded-md font-mono text-sm tracking-widest uppercase">
                        {invoice.customer.vehicle || 'N/A'}
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-10 min-h-[300px]">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                            <th className="text-center py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">Qty</th>
                            <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Unit Price</th>
                            <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoice.items.map((item, index) => (
                            <tr key={index}>
                                <td className="py-5">
                                    <p className="font-bold text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {item.type === 'service' ? 'Maintenance Service' : `${item.brand} | ${item.size}`}
                                    </p>
                                </td>
                                <td className="text-center py-5 text-slate-600 font-medium">{item.quantity}</td>
                                <td className="text-right py-5 text-slate-600 font-medium">₹{item.price.toLocaleString('en-IN')}</td>
                                <td className="text-right py-5 font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals and Payment History Section */}
            <div className="grid grid-cols-2 gap-10 border-t-2 border-slate-100 pt-10">
                <div className="space-y-6">
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Payment History</p>
                            <div className="space-y-2">
                                {invoice.payments.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            <span className="text-slate-600 font-medium">
                                                {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[8px] font-black uppercase tracking-widest">{p.mode}</span>
                                        </div>
                                        <span className="font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center text-slate-700">
                            <CreditCard className="h-4 w-4 mr-2 text-[var(--color-primary)]" />
                            <p className="text-[10px] font-black uppercase tracking-widest">
                                Initial Payment: <span className="text-slate-900">₹{(invoice.paidAmount - (invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)).toLocaleString('en-IN')}</span> ({invoice.paymentMode})
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-bold text-slate-900">₹{(invoice.subtotal || invoice.total + (invoice.discount || 0)).toLocaleString('en-IN')}</span>
                    </div>
                    {invoice.discount > 0 && (
                        <div className="flex justify-between text-sm text-red-500">
                            <span>Discount Applied</span>
                            <span className="font-bold">- ₹{invoice.discount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grand Total</span>
                        <span className="text-2xl font-black text-slate-900">₹{invoice.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-bold bg-green-50 px-3 py-2 rounded-lg">
                        <span>Total Paid</span>
                        <span>₹{invoice.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {invoice.balanceAmount > 0 && (
                        <div className="flex justify-between text-sm text-orange-600 font-bold bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                            <span>Balance Due</span>
                            <span>₹{invoice.balanceAmount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center opacity-60">
                <p className="text-[10px] font-bold uppercase tracking-widest">Computer Generated Invoice</p>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Authenticated By</p>
                    <p className="font-black text-slate-900 italic text-sm">{shopDetails.shopName}</p>
                </div>
            </div>

            {/* Corner Accent Bottom */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-50 opacity-50 rounded-tl-[100px] -z-10"></div>
        </div>
    );
});

export default InvoiceTemplate;
