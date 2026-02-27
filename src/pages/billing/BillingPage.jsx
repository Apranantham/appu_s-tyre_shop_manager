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
import { CheckCircle2, Download, MessageSquare, Printer, X, Plus, Home, ShoppingCart, Edit2, QrCode } from 'lucide-react';

const BillingPage = () => {
    const { products, updateStock } = useProducts();
    const { addInvoice, updateInvoice, deleteInvoice } = useInvoices();
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
    const getLocalDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
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
            setPaymentStatus(editInvoice.paymentStatus || 'paid');
            setPaidAmount(editInvoice.paidAmount || editInvoice.total || 0);
            setPaymentNote(editInvoice.paymentNote || '');
            setBillingDate(new Date(editInvoice.date).toISOString().split('T')[0]);
            setIsAutoTime(false); // Don't auto-update when editing an old invoice
            setShowCart(true); // Switch to cart view immediately

            // Note: We keep the state here for a moment to capture 'from' if it exists
        }
    }, [location.state, navigate, location.pathname]);

    const returnPath = location.state?.from;

    const handleBackToSource = () => {
        if (returnPath) {
            navigate(returnPath);
        } else {
            navigate(-1);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });

    const addToCart = (item, type) => {
        if (type === 'product') {
            const liveProduct = products.find(p => p.id === item.id);
            const currentStock = liveProduct?.stock || 0;

            if (currentStock <= 0) {
                alert(lang === 'ta' ? 'இந்த தயாரிப்பு கையிருப்பில் இல்லை!' : 'This product is out of stock!');
                return;
            }

            setCart(prev => {
                const existing = prev.find(i => i.id === item.id && i.type === type);
                if (existing) {
                    if (existing.quantity + 1 > currentStock) {
                        alert(lang === 'ta' ? `போதிய இருப்பு இல்லை! மீதமுள்ள இருப்பு: ${currentStock}` : `Insufficient stock! Available stock: ${currentStock}`);
                        return prev;
                    }
                    return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return [...prev, { ...item, type, quantity: 1, stock: currentStock }];
            });
        } else {
            setCart(prev => {
                const existing = prev.find(i => i.id === item.id && i.type === type);
                if (existing) {
                    return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return [...prev, { ...item, type, quantity: 1 }];
            });
        }
    };

    const updateQuantity = (id, type, change) => {
        setCart(prev => prev.map(i => {
            if (i.id === id && i.type === type) {
                const newQty = i.quantity + change;

                // Stock validation for increment
                if (type === 'product' && change > 0) {
                    const liveProduct = products.find(p => p.id === id);
                    const currentStock = liveProduct?.stock || 0;

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

    const removeItem = (id, type) => {
        setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
    };

    const handleUpdateCustomer = (field, value) => {
        setCustomer(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Deduct Stock
        cart.forEach(item => {
            if (item.type === 'product') {
                updateStock(item.id, item.quantity);
            }
        });

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal - (Number(discount) || 0);

        // Ensure paidAmount is synchronized with paymentStatus at final checkout
        let finalPaidAmount = Number(paidAmount) || 0;
        if (paymentStatus === 'paid') {
            finalPaidAmount = total;
        } else if (paymentStatus === 'pending') {
            finalPaidAmount = 0;
        }

        const invoiceData = {
            id: editingId || Date.now(),
            date: new Date(billingDate).toISOString(),
            customer: { ...customer },
            items: [...cart],
            subtotal,
            discount: Number(discount) || 0,
            total,
            paymentMode,
            paymentStatus,
            paidAmount: finalPaidAmount,
            paymentNote: paymentNote || '',
            balanceAmount: total - finalPaidAmount,
            isClosed: paymentStatus === 'paid',
            invoiceNo: editingInvoiceNo
        };

        let finalizedInvoice = { ...invoiceData };

        if (editingId) {
            await updateInvoice(editingId, invoiceData);
        } else {
            const addedResult = await addInvoice(invoiceData);
            // Handle new return format where addInvoice returns { id, invoiceNo }
            if (typeof addedResult === 'object') {
                finalizedInvoice.id = addedResult.id;
                finalizedInvoice.invoiceNo = addedResult.invoiceNo;
            } else {
                // Fallback for older code that just returned the string ID
                finalizedInvoice.id = addedResult;
            }
        }

        setLastInvoice(finalizedInvoice);
        setIsCheckoutSuccess(true);

        // Auto-print option removed to avoid the "null" issue described by user 
        // until they see the success screen and click print manually if needed,
        // or we can trigger it safely here if lastInvoice is set.
    };

    const resetBilling = () => {
        setCart([]);
        setCustomer({ name: '', phone: '', vehicle: '' });
        setShowCart(false);
        setIsCheckoutSuccess(false);
        setLastInvoice(null);
        setEditingId(null);
        setEditingInvoiceNo(null);
        setDiscount(0);
        setPaymentStatus('paid');
        setPaidAmount(0);
        setBillingDate(getLocalDateTime());
    };

    const shareOnWhatsApp = () => {
        if (!lastInvoice) return;

        const emojiMap = { product: '📦', service: '🛠️' };
        const itemsList = lastInvoice.items.map(item => `${emojiMap[item.type] || '🔹'} *${item.name}* (x${item.quantity}) - ₹${item.price.toLocaleString()}`).join('%0A');

        const border = '━━━━━━━━━━━━━━━━';
        const shopDisplayName = shopDetails?.shopName || 'TURBOTYRE';
        const shopAddress = shopDetails?.shopAddress ? `📍 ${shopDetails.shopAddress}%0A` : '';
        const shopPhone = shopDetails?.shopPhone ? `📞 ${shopDetails.shopPhone}%0A` : '';

        const message =
            `*${shopDisplayName}*
${shopAddress}${shopPhone}
*${border}*
🚀 *INVOICE SUMMARY (*#${lastInvoice.invoiceNo || lastInvoice.id}*)*
*${border}*

👤 *Customer:* ${lastInvoice.customer.name}
${lastInvoice.customer.vehicle ? `🚗 *Vehicle:* ${lastInvoice.customer.vehicle}%0A` : ''}📅 *Date:* ${new Date(lastInvoice.date).toLocaleDateString()}

*ITEMS:*
${itemsList}

*${border}*
💰 *Subtotal:* ₹${lastInvoice.subtotal?.toLocaleString()}
🏷️ *Discount:* -₹${lastInvoice.discount?.toLocaleString()}
⭐ *TOTAL:* ₹${lastInvoice.total?.toLocaleString()}
*${border}*

💵 *Paid:* ₹${lastInvoice.paidAmount?.toLocaleString()}
🛑 *Balance:* ₹${lastInvoice.balanceAmount?.toLocaleString()}
💳 *Status:* ${lastInvoice.paymentStatus?.toUpperCase() || 'PAID'}

*${border}*
Thank you for your business! 🏁`;

        const rawPhone = lastInvoice.customer.phone.replace(/[^0-9]/g, '');
        const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
        // Encode the message to prevent truncation from newlines/emojis
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message.replace(/%0A/g, '\n'))}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareViaSMS = () => {
        if (!lastInvoice) return;
        const message = `TurboTyre: Hello ${lastInvoice.customer.name}, your bill of ₹${lastInvoice.total.toFixed(2)} is paid. Invoice #${lastInvoice.id}. Thank you!`;
        const smsUrl = `sms:${lastInvoice.customer.phone}?body=${message}`;
        window.open(smsUrl);
    };

    const handleEditAfterPaid = async () => {
        if (lastInvoice) {
            try {
                await deleteInvoice(lastInvoice.id);
                // The instruction provided `setInvoiceItems`, but based on context, `setCart` is likely intended.
                // Following the instruction faithfully, using `setInvoiceItems`.
                // If `setInvoiceItems` is not defined, this will cause an error.
                // Assuming `setInvoiceItems` is a state setter for the items in the cart.
                // If it's meant to be `setCart`, please provide a new instruction.
                setCart(lastInvoice.items);
                setIsCheckoutSuccess(false);
                setShowCart(true);
                // We don't call deleteInvoice here because we want to keep it in context
                // until the user saves it again (which will call updateInvoice)
                // or we can delete it now to be safe and let handleCheckout re-add it.
                // Actually, deleting it now is better to avoid duplicates if they refresh.
            } catch (error) {
                console.error("Error deleting invoice for edit:", error);
                // Optionally, handle the error (e.g., show a toast notification)
            }
            setEditingId(lastInvoice.id);
            setLastInvoice(null);
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div ref={pageRef} className="min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden relative pb-20 lg:pb-0">
            {/* Success Overlay */}
            {isCheckoutSuccess && lastInvoice && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-start justify-center overflow-y-auto p-4 py-8">
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
                                            : lastInvoice.paymentStatus === 'partial'
                                                ? 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/20'
                                                : 'bg-red-500/15 text-red-500 ring-1 ring-red-500/20'
                                            }`}>
                                            {lastInvoice.paymentStatus === 'paid' ? (t.full_paid || 'Paid') : lastInvoice.paymentStatus === 'partial' ? (t.partial_paid || 'Partial') : (t.pay_later || 'Pending')}
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
                                        className="group relative bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20 overflow-hidden"
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
                                        className="group relative bg-[#25D366] hover:bg-[#1fb855] text-white rounded-2xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/20 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                        </div>
                                        <div className="text-center relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-wide leading-tight">WhatsApp</p>
                                            <p className="text-[7px] opacity-60 font-bold uppercase tracking-wider mt-0.5">Share</p>
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
            <div className={`w-full lg:w-[60%] h-fit lg:h-full ${showCart ? 'hidden md:block' : 'block'}`}>
                <BillingItems
                    onAddToCart={addToCart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    cart={cart}
                    onBack={handleBackToSource}
                />
            </div>

            {/* Right Side: Cart/Checkout */}
            <div className={`w-full lg:w-[40%] min-h-[500px] lg:h-full flex flex-col ${!showCart ? 'hidden md:block' : 'block'}`}>
                <div className="h-full flex flex-col">
                    <div className="flex-1 min-h-0 lg:overflow-hidden">
                        <BillingCart
                            cart={cart}
                            customer={customer}
                            onUpdateCustomer={handleUpdateCustomer}
                            onUpdateQuantity={updateQuantity}
                            onRemoveItem={removeItem}
                            onCheckout={handleCheckout}
                            paymentMode={paymentMode}
                            setPaymentMode={setPaymentMode}
                            discount={discount}
                            setDiscount={setDiscount}
                            billingDate={billingDate}
                            setBillingDate={handleDateChange}
                            paymentStatus={paymentStatus}
                            setPaymentStatus={setPaymentStatus}
                            paidAmount={paidAmount}
                            setPaidAmount={setPaidAmount}
                            paymentNote={paymentNote}
                            setPaymentNote={setPaymentNote}
                            onToggleView={() => setShowCart(false)}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Footer Toggle */}
            {!showCart && cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 z-40 md:hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
                    {/* Glassmorphism Background Container */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-card)] via-[var(--color-bg-card)]/95 to-transparent backdrop-blur-md -z-10" />

                    <Button
                        onClick={() => setShowCart(true)}
                        className="w-full h-20 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white shadow-[0_20px_40px_rgba(59,130,246,0.3)] rounded-[2rem] flex items-center justify-between px-8 border-none active:scale-[0.98] transition-all group overflow-hidden relative"
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

            {/* Print Template (Hidden from UI, visible only for print) */}
            {/* Print Template (Hidden from UI, visible only for print) */}
            <InvoiceTemplate ref={componentRef} invoice={lastInvoice} />

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
