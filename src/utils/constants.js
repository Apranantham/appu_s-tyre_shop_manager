export const PRODUCT_CATEGORIES = [
    { id: 'all', label: 'All Items', label_ta: 'அனைத்தும்' },
    { id: 'low_stock', label: 'Low Stock', label_ta: 'இருப்பு குறைவு' },
    { id: 'car', label: 'Car', label_ta: 'கார்' },
    { id: 'bike', label: 'Bike', label_ta: 'பைக்' },
    { id: 'truck', label: 'Truck', label_ta: 'லாரி' },
];

// Product TYPE — what kind of thing it is. Only 'tyre'/'tube' reveal the
// tyre-specific fields (size, load index, tube type, mfg year, vehicle class).
// Everything else is a plain generic product.
export const PRODUCT_TYPES = [
    { id: 'general', label: 'General', label_ta: 'பொது' },
    { id: 'tyre', label: 'Tyre', label_ta: 'டயர்' },
    { id: 'tube', label: 'Tube', label_ta: 'டியூப்' },
    { id: 'oil', label: 'Oil / Lubricant', label_ta: 'ஆயில்' },
    { id: 'battery', label: 'Battery', label_ta: 'பேட்டரி' },
    { id: 'accessory', label: 'Accessory', label_ta: 'அணிகலன்' },
    { id: 'spare', label: 'Spare Part', label_ta: 'உதிரி பாகம்' },
];

export const TYRE_TYPES = ['tyre', 'tube'];

export const PRODUCT_UNITS = [
    { id: 'pcs', label: 'Piece', label_ta: 'எண்' },
    { id: 'set', label: 'Set', label_ta: 'செட்' },
    { id: 'pair', label: 'Pair', label_ta: 'ஜோடி' },
    { id: 'litre', label: 'Litre', label_ta: 'லிட்டர்' },
    { id: 'box', label: 'Box', label_ta: 'பாக்ஸ்' },
    { id: 'kg', label: 'Kg', label_ta: 'கிலோ' },
];

// Suggested service groups — used to organize the Service page and the
// collapsible groups on the Billing page. Shops can also type their own; any
// group they save is remembered and offered as a suggestion thereafter.
export const SERVICE_GROUPS = [
    'Tyre Services',
    'Wheel Alignment',
    'Wheel Balancing',
    'Oil Services',
    'Washing',
    'Mechanical',
    'Electrical',
    'Others',
];

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543465077-111d4e4c965c?w=400&q=80';


export const INITIAL_PRODUCTS = [];
