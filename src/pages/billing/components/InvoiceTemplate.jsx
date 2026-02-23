import React from 'react';

const InvoiceTemplate = React.forwardRef(({ invoice, showPreview = false }, ref) => {
    if (!invoice) return null;

    return (
        <div
            ref={ref}
            className={`${showPreview ? 'block' : 'hidden print:block'} p-8 bg-[var(--color-bg-card)] text-[var(--color-text-dark)] min-h-[800px] w-full max-w-3xl mx-auto shadow-2xl`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider">TyreMaster</h1>
                    <p className="text-sm text-[var(--color-text-gray)]">123, Auto Garage Street</p>
                    <p className="text-sm text-[var(--color-text-gray)]">Chennai, TN 600001</p>
                    <p className="text-sm text-[var(--color-text-gray)]">Phone: +91 98765 43210</p>
                </div>
                <div className="text-right text-[var(--color-text-white)]">
                    <h2 className="text-xl font-bold mb-2">INVOICE</h2>
                    <p className="text-sm font-medium mb-2">#{invoice.id}</p>
                    <p className="text-[var(--color-text-gray)] uppercase text-[10px] tracking-widest mb-1">Date & Time</p>
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
                <h3 className="text-sm font-bold uppercase text-[var(--color-text-gray)] mb-2">Bill To</h3>
                <p className="font-bold">{invoice.customer.name}</p>
                <p>{invoice.customer.phone}</p>
                <p className="uppercase">{invoice.customer.vehicle}</p>
            </div>

            {/* Items */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-gray-800">
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                            <td className="py-2">
                                <span className="font-medium">{item.name}</span>
                                <div className="text-xs text-[var(--color-text-gray)]">
                                    {item.type === 'service' ? 'Service' : `${item.brand} ${item.size}`}
                                </div>
                            </td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-right py-2">₹{item.price}</td>
                            <td className="text-right py-2">₹{item.price * item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
                <div className="w-1/2">
                    <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Subtotal</span>
                        <span>₹{(invoice.subtotal || invoice.total + (invoice.discount || 0)).toFixed(2)}</span>
                    </div>
                    {invoice.discount > 0 && (
                        <div className="flex justify-between py-2 border-b text-red-600">
                            <span className="font-medium">Discount</span>
                            <span>- ₹{invoice.discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 font-bold text-xl">
                        <span>Total</span>
                        <span>₹{invoice.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm text-[var(--color-text-gray)]">
                        <span>Payment Mode</span>
                        <span className="uppercase">{invoice.paymentMode}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-[var(--color-text-gray)] mt-12 border-t pt-4">
                <p>Thank you for your business!</p>
                <p>TyreMaster - Wheel Alignment & Balancing Specialists</p>
            </div>
        </div>
    );
});

export default InvoiceTemplate;
