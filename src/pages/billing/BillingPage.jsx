import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import BillingItems from './components/BillingItems';
import BillingCart from './components/BillingCart';
import InvoiceTemplate from './components/InvoiceTemplate';
import UpiQrModal from './components/UpiQrModal';
import { useProducts } from '../../context/ProductContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { CheckCircle2, Printer, X, Plus, Home, ShoppingCart, Edit2, QrCode, PauseCircle, ReceiptText, ImageDown } from 'lucide-react';
import WhatsAppIcon from '../../components/ui/WhatsAppIcon';
import ThermalReceipt from './components/ThermalReceipt';
import { shareInvoiceImage } from '../../utils/invoiceImage';

// Local persistence keys: the in-progress bill survives refreshes, and bills can
// be parked ("held") to serve another customer, then resumed.
const DRAFT_KEY = 'tyreshop_billing_draft';
const HELD_KEY = 'tyreshop_held_bills';

const BillingPage = () => {
    const { products, updateStock } = useProducts();
    const { addInvoice, updateInvoice } = useInvoices();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const location = useLocation();
    const navigate = useNavigate();

    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState({ name: '', phone: '', vehicle: '' });
    const [paymentMode, setPaymentMode] = useState('cash');
    const [lastInvoice, setLastInvoice] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingInvoiceNo, setEditingInvoiceNo] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('paid');
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentNote, setPaymentNote] = useState('');
    const [discount, setDiscount] = useState(0);
    const [showUpiQr, setShowUpiQr] = useState(false);
    const [isAutoTime, setIsAutoTime] = useState(true);
    // Snapshot of the invoice being edited — used to apply only the *stock delta*
    // (and preserve payment history) instead of blindly re-deducting on save.
    const [editOriginal, setEditOriginal] = useState(null);
    // Guards against double-taps creating duplicate invoices.
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [heldBills, setHeldBills] = useState(() => {
        try { return JSON.parse(localStorage.getItem(HELD_KEY) || '[]'); } catch { return []; }
    });
    const getLocalDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Format any date into the `YYYY-MM-DDTHH:mm` shape a datetime-local input needs,
    // in LOCAL time (previous code truncated to date-only and lost the time).
    const toDateTimeLocal = (dateInput) => {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return getLocalDateTime();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [billingDate, setBillingDate] = useState(getLocalDateTime());

    // Auto-update time every minute if not manually overridden
    useEffect(() => {
        if (!isAutoTime) return;

        const interval = setInterval(() => {
            setBillingDate(getLocalDateTime());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [isAutoTime]);

    const handleDateChange = (newDate) => {
        setBillingDate(newDate);
        setIsAutoTime(false); // Stop auto-updates once user manually picks a time
    };

    const componentRef = useRef();
    const thermalRef = useRef();
    const pageRef = useRef();

    // Reset scroll when switching between items and cart on mobile
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (pageRef.current) {
                pageRef.current.scrollTo({ top: 0, behavior: 'instant' });
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [showCart]);

    // Handle incoming edit state
    React.useEffect(() => {
        if (location.state?.editInvoice) {
            const { editInvoice } = location.state;
            setCart(editInvoice.items);
            setCustomer(editInvoice.customer);
            setPaymentMode(editInvoice.paymentMode || 'cash');
            setDiscount(editInvoice.discount || 0);
            setEditingId(editInvoice.id);
            setEditingInvoiceNo(editInvoice.invoiceNo || null);
            setEditOriginal(editInvoice); // snapshot for stock-delta + payment history
            setPaymentStatus(editInvoice.paymentStatus || 'paid');
            // ?? not ||: a pending bill legitimately has paidAmount 0 and must
            // not be prefilled with the full total.
            setPaidAmount(editInvoice.paidAmount ?? 0);
            setPaymentNote(editInvoice.paymentNote || '');
            setBillingDate(toDateTimeLocal(editInvoice.date));
            setIsAutoTime(false); // Don't auto-update when editing an old invoice
            setShowCart(true); // Switch to cart view immediately

            // Note: We keep the state here for a moment to capture 'from' if it exists
        }
    }, [location.state, navigate, location.pathname]);

    // Restore an unsaved draft after a refresh/crash (skipped when opening an edit).
    // Defined BEFORE the autosave effect so it reads storage before the first write.
    useEffect(() => {
        if (location.state?.editInvoice) return;
        try {
            const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
            if (saved?.cart?.length) {
                setCart(saved.cart);
                setCustomer(saved.customer || { name: '', phone: '', vehicle: '' });
                setDiscount(saved.discount || 0);
                setPaymentMode(saved.paymentMode || 'cash');
                setPaymentStatus(saved.paymentStatus || 'paid');
                setPaidAmount(saved.paidAmount || 0);
                setPaymentNote(saved.paymentNote || '');
            }
        } catch { /* corrupt draft — ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-save the in-progress bill so a refresh never loses the cart.
    // isEditSessionRef guards the first render pass of an edit: editingId is
    // still null there, and without the ref the autosave would overwrite the
    // parked draft with an empty cart before the edit state commits.
    const isEditSessionRef = useRef(!!location.state?.editInvoice);
    const autosaveTimerRef = useRef(null);
    useEffect(() => {
        if (isEditSessionRef.current || editingId || isCheckoutSuccess) return;
        clearTimeout(autosaveTimerRef.current);
        // Debounced, and product images are stripped — cart lines carry the
        // full product doc including its base64 image, which would otherwise be
        // re-serialized on every keystroke and can blow the localStorage quota.
        autosaveTimerRef.current = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({
                cart: cart.map(({ image, ...rest }) => rest),
                customer, discount, paymentMode, paymentStatus, paidAmount, paymentNote
            }));
        }, 400);
        return () => clearTimeout(autosaveTimerRef.current);
    }, [cart, customer, discount, paymentMode, paymentStatus, paidAmount, paymentNote, editingId, isCheckoutSuccess]);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });
    const handlePrintReceipt = useReactToPrint({
        contentRef: thermalRef,
    });

    const handleExit = () => {
        if (location.state?.from) {
            navigate(location.state.from);
        } else {
            navigate(-1);
        }
    };

    const addToCart = (item, type) => {
        const addQty = Number(item.quantity) || 1;

        if (type === 'product') {
            const currentStock = availableStock(item.id);

            if (currentStock <= 0) {
                alert(lang === 'ta' ? 'இந்த தயாரிப்பு கையிருப்பில் இல்லை!' : 'This product is out of stock!');
                return;
            }

            setCart(prev => {
                const existing = prev.find(i => i.id === item.id && i.type === type);
                if (existing) {
                    if (existing.quantity + addQty > currentStock) {
                        alert(lang === 'ta' ? `போதிய இருப்பு இல்லை! மீதமுள்ள இருப்பு: ${currentStock}` : `Insufficient stock! Available stock: ${currentStock}`);
                        return prev;
                    }
                    return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + addQty } : i);
                }
                return [...prev, { ...item, type, quantity: addQty, stock: currentStock }];
            });
        } else {
            setCart(prev => {
                const existing = prev.find(i => i.id === item.id && i.type === type);
                if (existing) {
                    return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + addQty } : i);
                }
                return [...prev, { ...item, type, quantity: addQty }];
            });
        }
    };

    // Stock available to THIS bill: live stock plus whatever this bill already
    // deducted when it was first saved (live stock excludes the edited bill's
    // own units, which otherwise falsely blocks legitimate quantity increases).
    const availableStock = (id) => {
        const liveProduct = products.find(p => p.id === id);
        let stock = liveProduct?.stock || 0;
        if (editOriginal?.items) {
            const original = editOriginal.items.find(i => i.type === 'product' && i.id === id);
            stock += Number(original?.quantity) || 0;
        }
        return stock;
    };

    const handleUpdateQuantity = (id, type, change) => {
        setCart(prev => prev.map(i => {
            if (i.id === id && i.type === type) {
                const newQty = i.quantity + change;

                // Stock validation for increment
                if (type === 'product' && change > 0) {
                    const currentStock = availableStock(id);

                    if (newQty > currentStock) {
                        alert(lang === 'ta' ? `போதிய இருப்பு இல்லை! மீதமுள்ள இருப்பு: ${currentStock}` : `Insufficient stock! Available stock: ${currentStock}`);
                        return i;
                    }
                }

                return { ...i, quantity: Math.max(0, newQty) };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const handleRemoveItem = (id, type) => {
        setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
    };

    // Direct quantity entry (type "4" instead of tapping + four times).
    const handleSetQuantity = (id, type, qty) => {
        if (!Number.isFinite(qty) || qty < 1) return;
        let newQty = Math.floor(qty);
        if (type === 'product') {
            const currentStock = availableStock(id);
            if (newQty > currentStock) {
                alert(lang === 'ta' ? `போதிய இருப்பு இல்லை! மீதமுள்ள இருப்பு: ${currentStock}` : `Insufficient stock! Available stock: ${currentStock}`);
                if (currentStock < 1) return; // nothing available — keep the existing qty
                newQty = currentStock;
            }
        }
        setCart(prev => prev.map(i => (i.id === id && i.type === type) ? { ...i, quantity: newQty } : i));
    };

    // Per-line price override — tyre prices are negotiated at the counter.
    const handleUpdatePrice = (id, type, price) => {
        if (!Number.isFinite(price) || price < 0) return;
        setCart(prev => prev.map(i => (i.id === id && i.type === type) ? { ...i, price } : i));
    };

    const persistHeld = (list) => {
        setHeldBills(list);
        localStorage.setItem(HELD_KEY, JSON.stringify(list));
    };

    // Park the current bill to serve another customer.
    const holdCurrentBill = () => {
        if (cart.length === 0 || editingId) return;
        const entry = {
            id: Date.now(),
            heldAt: new Date().toISOString(),
            // Strip base64 product images — they bloat localStorage for nothing.
            cart: cart.map(({ image, ...rest }) => rest),
            customer, discount, paymentMode, paymentStatus, paidAmount, paymentNote
        };
        persistHeld([entry, ...heldBills]);
        resetBilling();
    };

    const resumeHeldBill = (id) => {
        const entry = heldBills.find(h => h.id === id);
        if (!entry) return;
        if (cart.length > 0) {
            alert(t.finish_current_first || 'Finish or hold the current bill before resuming another.');
            return;
        }
        setCart(entry.cart || []);
        setCustomer(entry.customer || { name: '', phone: '', vehicle: '' });
        setDiscount(entry.discount || 0);
        setPaymentMode(entry.paymentMode || 'cash');
        setPaymentStatus(entry.paymentStatus || 'paid');
        setPaidAmount(entry.paidAmount || 0);
        setPaymentNote(entry.paymentNote || '');
        persistHeld(heldBills.filter(h => h.id !== id));
    };

    const discardHeldBill = (id) => persistHeld(heldBills.filter(h => h.id !== id));

    const handleAddToCart = (item, type) => addToCart(item, type);

    const handleUpdateCustomer = (field, value) => {
        setCustomer(prev => ({ ...prev, [field]: value }));
    };

    // Sum product quantities per product id (ignores services/old parts).
    const productQtyMap = (items) => {
        const map = {};
        (items || []).forEach(it => {
            if (it.type === 'product' && it.id != null) {
                map[it.id] = (map[it.id] || 0) + (Number(it.quantity) || 0);
            }
        });
        return map;
    };

    // Firestore write promises never resolve while offline (writes queue in
    // IndexedDB and sync later). Don't let a queued write hang checkout: race
    // against a short grace period and assume "queued" if it hasn't settled.
    const awaitOrQueue = (promise, ms = 4000) => {
        promise.catch(() => { }); // avoid unhandled rejection if the timeout wins
        return Promise.race([promise, new Promise(resolve => setTimeout(resolve, ms))]);
    };

    const handleCheckout = async () => {
        if (cart.length === 0 || isSubmitting) return; // guard against double-submit
        setIsSubmitting(true);
        try {
            const totalItems = cart.filter(i => i.type !== 'old_part').reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const totalExchange = cart.filter(i => i.type === 'old_part').reduce((sum, item) => sum + ((item.exchangeValue || 0) * (item.quantity || 1)), 0);
            const subtotal = totalItems - totalExchange;
            // Clamp discount to [0, subtotal] so the total can never go negative.
            const discountVal = Math.min(Math.max(0, Number(discount) || 0), Math.max(0, subtotal));
            const total = subtotal - discountVal;

            // Preserve any previously recorded payments; only add the new money as
            // an extra payment line so installment history is never wiped on edit.
            const priorPayments = editingId ? (editOriginal?.payments || []) : [];
            const recordedTotal = priorPayments.reduce((s, p) => s + (p.amount || 0), 0);

            let finalPaidAmount = Number(paidAmount) || 0;
            if (paymentStatus === 'paid') finalPaidAmount = total;
            else if (paymentStatus === 'pending') finalPaidAmount = 0;
            // Never drop money that was actually recorded against this bill.
            finalPaidAmount = Math.max(finalPaidAmount, recordedTotal);

            const payments = [...priorPayments];
            if (finalPaidAmount > recordedTotal) {
                payments.push({
                    amount: finalPaidAmount - recordedTotal,
                    date: new Date(billingDate).toISOString(),
                    mode: paymentMode,
                    note: paymentNote || (editingId ? 'Adjustment' : 'Initial payment')
                });
            }

            const derivedStatus = finalPaidAmount <= 0
                ? 'pending'
                : (finalPaidAmount >= total ? 'paid' : 'partially_paid');

            const invoiceData = {
                id: editingId || Date.now(),
                date: new Date(billingDate).toISOString(),
                customer: { ...customer },
                items: [...cart],
                subtotal,
                totalItems,
                totalExchange,
                discount: discountVal,
                total,
                paymentMode,
                paymentStatus: derivedStatus,
                paidAmount: finalPaidAmount,
                paymentNote: paymentNote || '',
                balanceAmount: total - finalPaidAmount,
                isClosed: derivedStatus === 'paid',
                invoiceNo: editingInvoiceNo,
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
                payments
            };

            let finalizedInvoice = { ...invoiceData };

            // Save the bill FIRST. Stock moves only after the invoice exists, so
            // a failed save can never leave phantom stock deductions, and the
            // audit log gets the real invoice number instead of a blank ref.
            if (editingId) {
                await awaitOrQueue(updateInvoice(editingId, invoiceData));
            } else {
                const addedResult = await addInvoice(invoiceData);
                // addInvoice returns { id, invoiceNo }; fall back to a bare id string.
                if (addedResult && typeof addedResult === 'object') {
                    finalizedInvoice.id = addedResult.id;
                    finalizedInvoice.invoiceNo = addedResult.invoiceNo;
                } else {
                    finalizedInvoice.id = addedResult;
                }
            }

            // Apply stock changes. For a NEW bill, deduct each product's quantity.
            // For an EDIT, apply only the delta vs. the original bill so stock is
            // never double-counted.
            const originalQty = editingId ? productQtyMap(editOriginal?.items) : {};
            const newQty = productQtyMap(cart);
            const stockOps = [];
            new Set([...Object.keys(originalQty), ...Object.keys(newQty)]).forEach(id => {
                const delta = (newQty[id] || 0) - (originalQty[id] || 0);
                // updateStock deducts `delta`; a negative delta returns stock.
                if (delta !== 0) stockOps.push(updateStock(id, delta, {
                    reason: editingId ? 'sale_edit' : 'sale',
                    refId: finalizedInvoice.invoiceNo || null,
                    note: customer?.name || ''
                }).catch(e => console.error('Stock update failed:', e)));
            });
            await awaitOrQueue(Promise.all(stockOps));

            setLastInvoice(finalizedInvoice);
            setIsCheckoutSuccess(true);
            localStorage.removeItem(DRAFT_KEY); // bill saved — draft no longer needed
        } catch (err) {
            console.error("Checkout failed:", err);
            alert(lang === 'ta'
                ? 'பில் சேமிப்பதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
                : 'Could not save the bill. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetBilling = () => {
        isEditSessionRef.current = false; // leaving the edit session — autosave may resume
        setCart([]);
        setCustomer({ name: '', phone: '', vehicle: '' });
        setShowCart(false);
        setIsCheckoutSuccess(false);
        setLastInvoice(null);
        setEditingId(null);
        setEditingInvoiceNo(null);
        setEditOriginal(null);
        setIsSubmitting(false);
        setDiscount(0);
        setPaymentMode('cash');
        setPaymentStatus('paid');
        setPaidAmount(0);
        setPaymentNote('');
        setIsAutoTime(true);
        setBillingDate(getLocalDateTime());
    };

    const shareOnWhatsApp = () => {
        if (!lastInvoice) return;

        const itemsList = lastInvoice.items.map(item => {
            if (item.type === 'old_part') {
                return `${item.quantity}x ${item.name} (Exchange) - -₹${(item.exchangeValue * item.quantity).toLocaleString('en-IN')}`;
            }
            return `${item.quantity}x ${item.name} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`;
        }).join('%0A');

        const border = '--------------------------';
        const shopDisplayName = (shopDetails?.shopName || 'TURBOTYRE').toUpperCase();
        const shopAddress = shopDetails?.shopAddress ? `${shopDetails.shopAddress}%0A` : '';
        const shopPhone = shopDetails?.shopPhone ? `Phone: ${shopDetails.shopPhone}%0A` : '';

        const message =
            `${shopDisplayName}
${shopAddress}${shopPhone}${border}
INVOICE SUMMARY: #${lastInvoice.invoiceNo || lastInvoice.id}
${border}

Customer: ${lastInvoice.customer.name}
${lastInvoice.customer.vehicle ? `Vehicle: ${lastInvoice.customer.vehicle}%0A` : ''}Date: ${new Date(lastInvoice.date).toLocaleDateString()}

ITEMS:
${itemsList}

${border}
Subtotal: ₹${lastInvoice.subtotal?.toLocaleString()}
Discount: -₹${lastInvoice.discount?.toLocaleString()}
Total: ₹${lastInvoice.total?.toLocaleString()}
${border}

Paid: ₹${lastInvoice.paidAmount?.toLocaleString()}
Balance: ₹${lastInvoice.balanceAmount?.toLocaleString()}
Status: ${lastInvoice.paymentStatus?.toUpperCase() || 'PAID'}

${border}
Thank you for your business!`;

        const rawPhone = lastInvoice.customer.phone.replace(/[^0-9]/g, '');
        const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
        // Encode the message to prevent truncation from newlines/emojis
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message.replace(/%0A/g, '\n'))}`;
        window.open(whatsappUrl, '_blank');
    };

    // Re-open the just-saved bill for editing. We keep the invoice in place and
    // let handleCheckout run its update + stock-delta path — no delete/re-add, so
    // there is no window where a refresh could lose or duplicate the bill.
    const handleEditAfterPaid = () => {
        if (!lastInvoice) return;
        setCart(lastInvoice.items || []);
        setCustomer(lastInvoice.customer || { name: '', phone: '', vehicle: '' });
        setEditingId(lastInvoice.id);
        setEditingInvoiceNo(lastInvoice.invoiceNo || null);
        setEditOriginal(lastInvoice);
        setPaymentMode(lastInvoice.paymentMode || 'cash');
        setDiscount(lastInvoice.discount || 0);
        setPaymentStatus(lastInvoice.paymentStatus || 'paid');
        setPaidAmount(lastInvoice.paidAmount || 0);
        setPaymentNote(lastInvoice.paymentNote || '');
        setBillingDate(toDateTimeLocal(lastInvoice.date));
        setIsAutoTime(false);
        setIsCheckoutSuccess(false);
        setShowCart(true);
    };

    const cartTotal = cart.reduce((sum, item) => {
        if (item.type === 'old_part') {
            return sum - (item.exchangeValue || 0);
        }
        return sum + (item.price * item.quantity);
    }, 0);

    return (
        <div ref={pageRef} className="min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden relative pb-20 lg:pb-0">
            {/* Success Overlay */}
            {isCheckoutSuccess && lastInvoice && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-start justify-center overflow-y-auto p-4 py-8 print:hidden">
                    <Card className="w-full max-w-md p-0 border-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.1)] animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-500 overflow-hidden rounded-[2.5rem] shrink-0">

                        {/* Hero Header with Gradient */}
                        <div className="relative bg-gradient-to-br from-emerald-600 via-green-500 to-teal-400 px-8 pt-10 pb-14 text-white text-center overflow-hidden">
                            {/* Animated Background Dots */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute top-6 left-8 w-3 h-3 bg-white/15 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                                <div className="absolute top-16 right-12 w-2 h-2 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                                <div className="absolute bottom-10 left-16 w-2.5 h-2.5 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                                <div className="absolute top-10 left-1/2 w-2 h-2 bg-white/15 rounded-full animate-ping" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
                                <div className="absolute bottom-20 right-8 w-3 h-3 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.8s' }} />
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
                                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
                            </div>

                            {/* Success Icon */}
                            <div className="relative z-10">
                                <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-black/10 ring-4 ring-white/20">
                                    <CheckCircle2 className="h-12 w-12 text-white drop-shadow-lg" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-1 drop-shadow-sm">{t.payment_paid || 'Payment Successful!'}</h2>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    {lastInvoice.invoiceNo ? `#${lastInvoice.invoiceNo}` : `ID: ${lastInvoice.id}`}
                                </p>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="bg-[var(--color-bg-card)]">

                            {/* Amount Badge - Floating */}
                            <div className="relative z-10 -mt-7 px-5">
                                <div className="bg-[var(--color-bg-dark)] border border-emerald-500/20 rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl">
                                    <div>
                                        <p className="text-[8px] font-black text-[var(--color-text-gray)] uppercase tracking-[0.25em] opacity-50">{t.total_amount || 'Total Amount'}</p>
                                        <p className="text-2xl font-black text-[var(--color-text)] tracking-tight">₹{lastInvoice.total?.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 text-[var(--color-text-gray)]">{t.payment_status || 'Status'}</p>
                                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${lastInvoice.paymentStatus === 'paid'
                                            ? 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/20'
                                            : lastInvoice.paymentStatus === 'partially_paid'
                                                ? 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/20'
                                                : 'bg-danger/15 text-danger ring-1 ring-danger/20'
                                            }`}>
                                            {lastInvoice.paymentStatus === 'paid' ? (t.full_paid || 'Paid') : lastInvoice.paymentStatus === 'partially_paid' ? (t.partial_paid || 'Partial') : (t.pay_later || 'Pending')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Share Actions */}
                            <div className="px-5 pt-5 pb-2">
                                <p className="text-[8px] font-black text-[var(--color-text-gray)] uppercase tracking-[0.25em] opacity-40 mb-3 px-1">{t.share_invoice || 'Share Invoice'}</p>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {/* Print */}
                                    <button
                                        onClick={() => handlePrint()}
                                        className="group relative bg-primary hover:bg-primary-hover text-white rounded-2xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-black/25 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                                            <Printer className="h-5 w-5" />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-wide leading-tight">Print</p>
                                            <p className="text-[7px] opacity-60 font-bold uppercase tracking-wider mt-0.5">PDF</p>
                                        </div>
                                    </button>

                                    {/* WhatsApp */}
                                    <button
                                        onClick={shareOnWhatsApp}
                                        className="group relative bg-[#25D366] hover:bg-[#1fb855] text-white rounded-2xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-black/25 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                                            <WhatsAppIcon className="h-5 w-5" />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-wide leading-tight">WhatsApp</p>
                                            <p className="text-[7px] opacity-60 font-bold uppercase tracking-wider mt-0.5">Share</p>
                                        </div>
                                    </button>

                                    {/* Thermal receipt */}
                                    <button
                                        onClick={() => handlePrintReceipt()}
                                        className="group relative bg-slate-600 hover:bg-slate-700 text-white rounded-2xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                                            <ReceiptText className="h-5 w-5" />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-wide leading-tight">{lang === 'ta' ? 'ரசீது' : 'Receipt'}</p>
                                            <p className="text-[7px] opacity-60 font-bold uppercase tracking-wider mt-0.5">80mm</p>
                                        </div>
                                    </button>

                                    {/* Bill as image (real bill via share sheet / WhatsApp) */}
                                    <button
                                        onClick={() => lastInvoice && shareInvoiceImage(lastInvoice, shopDetails)}
                                        className="group relative bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                                            <ImageDown className="h-5 w-5" />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-wide leading-tight">{lang === 'ta' ? 'பில் படம்' : 'Bill Image'}</p>
                                            <p className="text-[7px] opacity-60 font-bold uppercase tracking-wider mt-0.5">PNG</p>
                                        </div>
                                    </button>

                                    {/* UPI QR */}
                                    <button
                                        onClick={() => setShowUpiQr(true)}
                                        className="group relative bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-2xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                                            <QrCode className="h-5 w-5" />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-wide leading-tight">{t.upi_qr_code || 'UPI QR'}</p>
                                            <p className="text-[7px] opacity-60 font-bold uppercase tracking-wider mt-0.5">{t.scan_to_pay || 'Pay'}</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Next Bill & Edit Bill */}
                            <div className="px-5 pt-4">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <Button
                                        className="bg-emerald-500 hover:bg-emerald-600 py-4 rounded-2xl text-[10px] font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center uppercase tracking-[0.15em] border-none active:scale-95 transition-all"
                                        onClick={resetBilling}
                                    >
                                        <Plus className="h-4 w-4 mr-1.5 stroke-[3px]" /> {t.new_bill || 'Next Bill'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="py-4 rounded-2xl text-[10px] font-black border-2 border-[var(--color-border)] hover:bg-[var(--color-bg-dark)]/50 flex items-center justify-center uppercase tracking-[0.15em] active:scale-95 transition-all"
                                        onClick={handleEditAfterPaid}
                                    >
                                        <Edit2 className="h-4 w-4 mr-1.5 stroke-[3px]" /> {t.edit_bill || 'Edit Bill'}
                                    </Button>
                                </div>
                            </div>

                            {/* Back to Home */}
                            <div className="px-5 pt-3 pb-6">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full group flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-[var(--color-bg-dark)]/60 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-bg-dark)] transition-all active:scale-[0.98]"
                                >
                                    <div className="h-9 w-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:bg-[var(--color-primary)]/20 transition-colors">
                                        <Home className="h-4 w-4 text-[var(--color-primary)]" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black text-[var(--color-text)] uppercase tracking-tight">{t.back_to_home || 'Back to Home'}</p>
                                        <p className="text-[8px] font-bold text-[var(--color-text-gray)] uppercase tracking-[0.15em] opacity-50">{t.return_to_dashboard || 'Return to Dashboard'}</p>
                                    </div>
                                </button>
                            </div>

                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Left Side: Items (Search/Grid) */}
            <div className={`w-full lg:w-[60%] h-fit lg:h-full flex-col gap-3 ${showCart ? 'hidden md:flex' : 'flex'}`}>
                {/* Held (parked) bills — resume or discard */}
                {heldBills.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-card border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] overflow-x-auto shrink-0">
                        <PauseCircle className="h-4 w-4 text-[var(--color-warning)] shrink-0 ml-1" />
                        {heldBills.map(h => {
                            const heldTotal = (h.cart || []).reduce((sum, i) =>
                                i.type === 'old_part'
                                    ? sum - ((i.exchangeValue || 0) * (i.quantity || 1))
                                    : sum + ((i.price || 0) * (i.quantity || 1)), 0);
                            return (
                                <div key={h.id} className="flex items-center gap-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-pill pl-3 pr-1 py-1 shrink-0">
                                    <span className="text-xs font-bold text-[var(--color-text)] whitespace-nowrap">
                                        {h.customer?.name || (lang === 'ta' ? 'வாடிக்கையாளர்' : 'Walk-in')} · {(h.cart || []).length} · ₹{heldTotal.toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => resumeHeldBill(h.id)}
                                        className="px-2.5 py-1 rounded-pill bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-wide active:scale-95 transition-transform"
                                    >
                                        {t.resume || 'Resume'}
                                    </button>
                                    <button
                                        onClick={() => discardHeldBill(h.id)}
                                        className="p-1 text-[var(--color-text-gray)] hover:text-danger transition-colors"
                                        aria-label="Discard held bill"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="flex-1 min-h-0">
                    <BillingItems
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        cart={cart}
                        onBack={handleExit}
                        editingInvoiceNo={editingInvoiceNo}
                    />
                </div>
            </div>

            {/* Right Side: Cart/Checkout */}
            <div className={`w-full lg:w-[40%] min-h-[500px] lg:h-full flex flex-col ${!showCart ? 'hidden md:block' : 'block'}`}>
                <div className="h-full flex flex-col">
                    <div className="flex-1 min-h-0 lg:overflow-hidden">
                        <BillingCart
                            cart={cart}
                            customer={customer}
                            onUpdateCustomer={handleUpdateCustomer}
                            onUpdateQuantity={handleUpdateQuantity}
                            onSetQuantity={handleSetQuantity}
                            onUpdatePrice={handleUpdatePrice}
                            onRemoveItem={handleRemoveItem}
                            onCheckout={handleCheckout}
                            onHold={editingId ? undefined : holdCurrentBill}
                            isSubmitting={isSubmitting}
                            paymentMode={paymentMode}
                            setPaymentMode={setPaymentMode}
                            discount={discount}
                            setDiscount={setDiscount}
                            billingDate={billingDate}
                            setBillingDate={setBillingDate}
                            paymentStatus={paymentStatus}
                            setPaymentStatus={setPaymentStatus}
                            paidAmount={paidAmount}
                            setPaidAmount={setPaidAmount}
                            paymentNote={paymentNote}
                            setPaymentNote={setPaymentNote}
                            onToggleView={() => setShowCart(false)}
                            editingInvoiceNo={editingInvoiceNo}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Footer Toggle */}
            {!showCart && cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 z-40 md:hidden animate-in fade-in slide-in-from-bottom-10 duration-500 print:hidden">
                    {/* Glassmorphism Background Container */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-card)] via-[var(--color-bg-card)]/95 to-transparent backdrop-blur-md -z-10" />

                    <Button
                        onClick={() => setShowCart(true)}
                        className="w-full h-20 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white shadow-[0_20px_40px_rgba(255,122,47,0.3)] rounded-[2rem] flex items-center justify-between px-8 border-none active:scale-[0.98] transition-all group overflow-hidden relative"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <ShoppingCart className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase opacity-70 tracking-[0.2em] mb-0.5">{t.view_bill || 'BILLING'}</p>
                                <p className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                                    {lang === 'ta' ? 'ரசீது பார்க்க' : 'VIEW CART'}
                                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                    <span>({cart.length})</span>
                                </p>
                            </div>
                        </div>

                        <div className="text-right relative z-10">
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">Total Amount</p>
                            <p className="text-2xl font-black tracking-tighter">₹{cartTotal.toLocaleString()}</p>
                        </div>
                    </Button>
                </div>
            )}

            {/* Print templates (hidden from UI, used only for printing) */}
            <InvoiceTemplate ref={componentRef} invoice={lastInvoice} />
            <div className="hidden">
                <ThermalReceipt ref={thermalRef} invoice={lastInvoice} shopDetails={shopDetails} />
            </div>

            {/* UPI QR Code Modal (portaled to body so it appears above the success overlay) */}
            {showUpiQr && lastInvoice && createPortal(
                <UpiQrModal
                    amount={lastInvoice.total}
                    onClose={() => setShowUpiQr(false)}
                    shopName={shopDetails?.shopName}
                    t={t}
                />,
                document.body
            )}
        </div>
    );
};

export default BillingPage;
