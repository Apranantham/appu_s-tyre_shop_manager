// Bilingual name helpers. Products & services keep `name` (primary, required)
// and gain an optional `nameAlt` (the same item's name in the other language).
// Nothing else in the app changes — only these two names become bilingual.

// Detects Tamil script so we can show the two names in a sensible order.
export const hasTamil = (s) => /[஀-௿]/.test(String(s || ''));

// Primary line = whatever the shop typed as `name`. Secondary line = `nameAlt`
// when it exists and differs. Returns { primary, secondary }.
export const displayNames = (item) => {
    const primary = item?.name || '';
    const alt = item?.nameAlt || '';
    const secondary = alt && alt.trim() && alt.trim() !== primary.trim() ? alt : '';
    return { primary, secondary };
};

// Cross-language search: matches if the query appears in EITHER name (or any
// extra field like size/brand/barcode). Type-in-Tamil finds an English-named
// item and vice-versa, as long as both names are filled in.
export const matchesQuery = (item, query, extraFields = []) => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    const parts = [item?.name, item?.nameAlt, ...extraFields.map((f) => item?.[f])];
    const hay = parts.filter(Boolean).join(' ').toLowerCase();
    return q.split(/\s+/).every((tok) => hay.includes(tok));
};
