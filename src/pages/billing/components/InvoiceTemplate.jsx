import React from 'react';
import { useSettings } from '../../../context/SettingsContext';

const InvoiceTemplate = React.forwardRef(({ invoice, showPreview = false }, ref) => {
    const { shopDetails } = useSettings();
    if (!invoice) return null;

    return (
        <div
            ref={ref}
            className={`${showPreview ? 'block' : 'hidden print:block'} p-8 bg-white text-slate-900 min-h-[800px] w-full max-w-3xl mx-auto shadow-2xl`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">{shopDetails.shopName}</h1>
                    <div className="text-sm text-slate-500 max-w-[250px] whitespace-pre-wrap">
                        {shopDetails.shopAddress}
                    </div>
                    <p className="text-sm text-slate-500">Phone: {shopDetails.shopPhone}</p>
                </div>
                <div className="text-right text-slate-900">
                    <h2 className="text-xl font-bold mb-2">INVOICE</h2>
                    <p className="text-sm font-medium mb-2 text-slate-700">#{invoice.id}</p>
                    <p className="text-slate-400 uppercase text-[10px] tracking-widest mb-1">Date & Time</p>
                    <p className="font-bold text-sm">
                        {invoice.date ? new Date(invoice.date).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }) : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Customer */}
            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Bill To</h3>
                <p className="font-bold text-slate-900">{invoice.customer.name}</p>
                <p className="text-slate-700">{invoice.customer.phone}</p>
                <p className="uppercase text-slate-700">{invoice.customer.vehicle}</p>
            </div>

            {/* Items */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-slate-800">
                        <th className="text-left py-2 text-slate-900">Item</th>
                        <th className="text-center py-2 text-slate-900">Qty</th>
                        <th className="text-right py-2 text-slate-900">Price</th>
                        <th className="text-right py-2 text-slate-900">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
                            <td className="py-2">
                                <span className="font-medium text-slate-900">{item.name}</span>
                                <div className="text-xs text-slate-500">
                                    {item.type === 'service' ? 'Service' : `${item.brand} ${item.size}`}
                                </div>
                            </td>
                            <td className="text-center py-2 text-slate-700">{item.quantity}</td>
                            <td className="text-right py-2 text-slate-700">₹{item.price}</td>
                            <td className="text-right py-2 text-slate-900 font-medium">₹{item.price * item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
                <div className="w-1/2">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="font-medium text-slate-600">Subtotal</span>
                        <span className="text-slate-900">₹{(invoice.subtotal || invoice.total + (invoice.discount || 0)).toFixed(2)}</span>
                    </div>
                    {invoice.discount > 0 && (
                        <div className="flex justify-between py-2 border-b border-slate-100 text-red-600">
                            <span className="font-medium">Discount</span>
                            <span>- ₹{invoice.discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 font-bold text-xl text-slate-900">
                        <span>Total</span>
                        <span>₹{invoice.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm text-slate-500">
                        <span>Payment Mode</span>
                        <span className="uppercase">{invoice.paymentMode}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-slate-400 mt-12 border-t border-slate-100 pt-4">
                <p>Thank you for your business!</p>
                <p>TyreMaster - Wheel Alignment & Balancing Specialists</p>
            </div>
        </div>
    );
});

export default InvoiceTemplate;
