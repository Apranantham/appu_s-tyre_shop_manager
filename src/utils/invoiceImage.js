/**
 * Renders an invoice as a PNG on a canvas (no libraries) and shares it as a
 * real image file via the Web Share API — on Android this opens the share
 * sheet with WhatsApp, so the customer gets the actual bill, not a text blob.
 * Falls back to downloading the PNG where file-sharing isn't available.
 */

const W = 640;          // canvas width (px)
const PAD = 36;         // outer padding
const LH = 34;          // base line height

const money = (n) => `Rs.${(n || 0).toLocaleString('en-IN')}`;

// Wrap text to fit maxWidth; returns the lines drawn.
const wrap = (ctx, text, maxWidth) => {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    words.forEach(w => {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && cur) {
            lines.push(cur);
            cur = w;
        } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
};

export const generateInvoiceImage = (invoice, shopDetails) => {
    const items = invoice.items || [];
    const normalItems = items.filter(i => i.type !== 'old_part');
    const oldParts = items.filter(i => i.type === 'old_part');

    // ---- measure pass: estimate height ----
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = '22px monospace';
    let lines = 6; // header block
    items.forEach(it => { lines += 1 + wrap(meas, it.name, W - PAD * 2 - 160).length; });
    lines += 10; // totals + footer
    const H = PAD * 2 + lines * LH + 80;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000000';

    let y = PAD + 10;
    const center = (text, font) => {
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.fillText(text, W / 2, y);
        ctx.textAlign = 'left';
        y += LH;
    };
    const row = (left, right, font = '22px monospace') => {
        ctx.font = font;
        ctx.fillText(left, PAD, y);
        ctx.textAlign = 'right';
        ctx.fillText(right, W - PAD, y);
        ctx.textAlign = 'left';
        y += LH;
    };
    const dashed = () => {
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(PAD, y - 12);
        ctx.lineTo(W - PAD, y - 12);
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.restore();
        y += 14;
    };

    // Header
    center((shopDetails?.shopName || 'TYRE SHOP').toUpperCase(), 'bold 30px sans-serif');
    if (shopDetails?.shopAddress) center(shopDetails.shopAddress, '19px sans-serif');
    if (shopDetails?.shopPhone) center(`Ph: ${shopDetails.shopPhone}`, '19px sans-serif');
    dashed();

    row(`#${invoice.invoiceNo || invoice.id}`,
        new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        'bold 22px monospace');
    if (invoice.customer?.name) {
        row(invoice.customer.name, invoice.customer.vehicle ? String(invoice.customer.vehicle).toUpperCase() : '');
    }
    dashed();

    // Items
    const nameWidth = W - PAD * 2 - 160;
    const drawItem = (name, qtyPrice, amount) => {
        ctx.font = '22px monospace';
        wrap(ctx, name, nameWidth).forEach(l => { ctx.fillText(l, PAD, y); y += LH; });
        row(qtyPrice, amount);
    };
    normalItems.forEach(it => drawItem(
        `${it.name}${it.size ? ` (${it.size})` : ''}`,
        `  ${it.quantity} x ${money(it.price)}`,
        money((it.price || 0) * (it.quantity || 1))
    ));
    oldParts.forEach(it => drawItem(
        `OLD: ${it.name}`,
        `  ${it.quantity} x -${money(it.exchangeValue)}`,
        `-${money((it.exchangeValue || 0) * (it.quantity || 1))}`
    ));
    dashed();

    // Totals
    row('Subtotal', money(invoice.subtotal));
    if ((invoice.discount || 0) > 0) row('Discount', `-${money(invoice.discount)}`);
    row('TOTAL', money(invoice.total), 'bold 28px monospace');
    row(`Paid (${(invoice.paymentMode || 'cash').toUpperCase()})`, money(invoice.paidAmount));
    if ((invoice.balanceAmount || 0) > 0) row('BALANCE DUE', money(invoice.balanceAmount), 'bold 22px monospace');
    dashed();

    center('Thank you! Visit again.', '20px sans-serif');
    center('நன்றி! மீண்டும் வருக!', '20px sans-serif');

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
};

export const shareInvoiceImage = async (invoice, shopDetails) => {
    const blob = await generateInvoiceImage(invoice, shopDetails);
    if (!blob) return;
    const file = new File([blob], `invoice-${invoice.invoiceNo || invoice.id}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: `Invoice #${invoice.invoiceNo || invoice.id}` });
            return;
        } catch (err) {
            if (err?.name === 'AbortError') return; // user closed the share sheet
        }
    }
    // Fallback: download the PNG.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
};
