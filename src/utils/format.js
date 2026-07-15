// Shared formatting helpers — one place for currency and date-input strings
// so the screens, receipts, and share images can't drift apart.

// ₹1,23,456 (Indian grouping). Pass symbol 'Rs.' for print/canvas outputs
// where the rupee glyph may not render.
export const formatMoney = (n, symbol = '₹') =>
    `${symbol}${(n || 0).toLocaleString('en-IN')}`;

// Local YYYY-MM-DD for <input type="date"> — deliberately NOT toISOString(),
// which shifts to UTC and shows yesterday during early-morning IST hours.
export const toInputDate = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
