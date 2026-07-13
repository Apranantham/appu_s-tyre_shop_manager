import React, { forwardRef } from 'react';

/**
 * 80mm thermal receipt (also prints fine on 58mm — content is single column).
 * Pure inline styles, black on white, monospace: safe for any receipt printer
 * driver via the browser's print dialog.
 */
const line = 'print-dashed';

const ThermalReceipt = forwardRef(({ invoice, shopDetails }, ref) => {
    if (!invoice) return null;
    const money = (n) => `Rs.${(n || 0).toLocaleString('en-IN')}`;
    const items = invoice.items || [];
    const normalItems = items.filter(i => i.type !== 'old_part');
    const oldParts = items.filter(i => i.type === 'old_part');

    const S = {
        page: {
            width: '80mm',
            padding: '4mm 3mm',
            background: '#fff',
            color: '#000',
            fontFamily: "'Courier New', ui-monospace, monospace",
            fontSize: '11px',
            lineHeight: 1.45,
        },
        center: { textAlign: 'center' },
        bold: { fontWeight: 700 },
        dashed: { borderTop: '1px dashed #000', margin: '6px 0' },
        row: { display: 'flex', justifyContent: 'space-between', gap: '6px' },
        big: { fontSize: '15px', fontWeight: 700 },
    };

    return (
        <div ref={ref} style={S.page} className={line}>
            <style>{`@media print { @page { size: 80mm auto; margin: 0; } body { -webkit-print-color-adjust: exact; } }`}</style>

            {/* Shop header */}
            <div style={{ ...S.center }}>
                <div style={S.big}>{(shopDetails?.shopName || 'TYRE SHOP').toUpperCase()}</div>
                {shopDetails?.shopAddress && <div>{shopDetails.shopAddress}</div>}
                {shopDetails?.shopPhone && <div>Ph: {shopDetails.shopPhone}</div>}
            </div>

            <div style={S.dashed} />
            <div style={S.row}>
                <span style={S.bold}>#{invoice.invoiceNo || invoice.id}</span>
                <span>{new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            {invoice.customer?.name && (
                <div>
                    {invoice.customer.name}
                    {invoice.customer.phone ? ` / ${invoice.customer.phone}` : ''}
                    {invoice.customer.vehicle ? ` / ${String(invoice.customer.vehicle).toUpperCase()}` : ''}
                </div>
            )}

            <div style={S.dashed} />

            {/* Items */}
            {normalItems.map((it, i) => (
                <div key={i} style={{ marginBottom: '3px' }}>
                    <div>{it.name}{it.size ? ` (${it.size})` : ''}</div>
                    <div style={S.row}>
                        <span>{it.quantity} x {money(it.price)}</span>
                        <span style={S.bold}>{money((it.price || 0) * (it.quantity || 1))}</span>
                    </div>
                </div>
            ))}
            {oldParts.map((it, i) => (
                <div key={`o${i}`} style={{ marginBottom: '3px' }}>
                    <div>OLD: {it.name}</div>
                    <div style={S.row}>
                        <span>{it.quantity} x -{money(it.exchangeValue)}</span>
                        <span style={S.bold}>-{money((it.exchangeValue || 0) * (it.quantity || 1))}</span>
                    </div>
                </div>
            ))}

            <div style={S.dashed} />

            {/* Totals */}
            <div style={S.row}><span>Subtotal</span><span>{money(invoice.subtotal)}</span></div>
            {(invoice.discount || 0) > 0 && (
                <div style={S.row}><span>Discount</span><span>-{money(invoice.discount)}</span></div>
            )}
            <div style={{ ...S.row, ...S.big, margin: '4px 0' }}>
                <span>TOTAL</span><span>{money(invoice.total)}</span>
            </div>
            <div style={S.row}><span>Paid ({(invoice.paymentMode || 'cash').toUpperCase()})</span><span>{money(invoice.paidAmount)}</span></div>
            {(invoice.balanceAmount || 0) > 0 && (
                <div style={{ ...S.row, ...S.bold }}><span>BALANCE DUE</span><span>{money(invoice.balanceAmount)}</span></div>
            )}

            <div style={S.dashed} />
            <div style={S.center}>
                <div>Thank you! Visit again.</div>
                <div>நன்றி! மீண்டும் வருக!</div>
            </div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';
export default ThermalReceipt;
