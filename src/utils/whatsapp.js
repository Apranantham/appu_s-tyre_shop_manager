// Shared WhatsApp helper — normalizes Indian phone numbers and opens wa.me.
// Keeping this in one place means the country-code rules can't drift between
// the dues reminders, win-back nudges, and share buttons.

// '98765 43210' → '919876543210'; '09876543210' → '919876543210';
// already-prefixed '91…' passes through; anything else returns as digits.
export const normalizePhone = (phone) => {
    let raw = String(phone || '').replace(/[^0-9]/g, '');
    if (raw.length === 11 && raw.startsWith('0')) raw = raw.slice(1);
    if (raw.length === 10) return `91${raw}`;
    return raw;
};

// Opens a WhatsApp chat with the message prefilled. Without a usable phone
// number it opens the chat picker so the user can choose a recipient.
export const openWhatsApp = (phone, message) => {
    const normalized = normalizePhone(phone);
    const url = normalized.length >= 11
        ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};
