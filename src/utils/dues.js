// Single source of truth for "what counts as an outstanding due".
// Used by BOTH the dashboard Pending card and the Dues page so their totals
// can never disagree (they previously used slightly different predicates).

export const isOpenDue = (inv) =>
    !inv.isClosed &&
    (inv.paymentStatus === 'pending' || inv.paymentStatus === 'partially_paid') &&
    (inv.balanceAmount || 0) > 0;

export const sumOutstanding = (invoices) =>
    (invoices || []).filter(isOpenDue).reduce((s, inv) => s + (inv.balanceAmount || 0), 0);
