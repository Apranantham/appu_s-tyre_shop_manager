// A product "tracks stock" only if it has a numeric stock value. Products
// saved with a blank stock (generic / made-to-order / service-like items) are
// UNTRACKED — always sellable and never decremented. Tyres and counted goods
// keep a number and behave as before (guarded + decremented on sale).
export const isStockTracked = (product) =>
    !!product &&
    product.stock !== null &&
    product.stock !== undefined &&
    product.stock !== '';

// Can this product be added to a bill right now?
export const isSellable = (product) =>
    !isStockTracked(product) || Number(product.stock) > 0;
