import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import BillingItems from './components/BillingItems';
import BillingCart from './components/BillingCart';
import InvoiceTemplate from './components/InvoiceTemplate';
import { useProducts } from '../../context/ProductContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { CheckCircle2, Download, MessageSquare, Printer, X, Plus, Home, ShoppingCart, Edit2 } from 'lucide-react';

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
    const [paymentStatus, setPaymentStatus] = useState('paid');
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentNote, setPaymentNote] = useState('');
    const [discount, setDiscount] = useState(0);
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
            isClosed: paymentStatus === 'paid'
        };

        let finalizedInvoice = { ...invoiceData };

        if (editingId) {
            await updateInvoice(editingId, invoiceData);
        } else {
            const newId = await addInvoice(invoiceData);
            finalizedInvoice.id = newId;
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
🚀 *INVOICE SUMMARY*
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
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
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
                <div className="fixed inset-0 z-[100] bg-[var(--color-bg-dark)]/95 backdrop-blur-md flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-8 text-center space-y-6 border-[var(--color-primary)] shadow-[0_0_50px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-300">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 animate-bounce">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Payment Paid!</h2>
                            <p className="text-[var(--color-text-gray)]">Invoice #{lastInvoice.id} generated successfully</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <Button
                                className="flex items-center justify-center h-20 space-x-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg border-none"
                                onClick={() => handlePrint()}
                            >
                                <Printer className="h-8 w-8" />
                                <div className="text-left">
                                    <p className="font-black text-lg leading-tight uppercase">Print / PDF</p>
                                    <p className="text-xs opacity-80 uppercase font-bold">Print Bill Now</p>
                                </div>
                            </Button>

                            <Button
                                className="flex items-center justify-center h-20 space-x-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl shadow-green-500/20 border-none"
                                onClick={shareOnWhatsApp}
                            >
                                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                <div className="text-left">
                                    <p className="font-black text-lg leading-tight uppercase">WhatsApp</p>
                                    <p className="text-xs opacity-80 uppercase font-bold">Share to Customer</p>
                                </div>
                            </Button>
                        </div>

                        <div className="pt-8 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Button className="bg-green-500 py-6 rounded-2xl text-base font-black shadow-lg shadow-green-500/20 flex items-center justify-center uppercase tracking-widest border-none" onClick={resetBilling}>
                                    <Plus className="h-5 w-5 mr-2 stroke-[3px]" /> {t.new_bill || 'Next Bill'}
                                </Button>
                                <Button variant="outline" className="py-6 rounded-2xl text-base font-black border-2 border-[var(--color-border)] hover:bg-[var(--color-bg-dark)]/50 flex items-center justify-center uppercase tracking-widest" onClick={handleEditAfterPaid}>
                                    <Edit2 className="h-5 w-5 mr-2 stroke-[3px]" /> {t.edit_bill || 'Edit Bill'}
                                </Button>
                            </div>

                            <Button variant="ghost" className="w-full py-4 text-sm font-bold text-[var(--color-text-gray)] hover:text-[var(--color-text-white)] flex items-center justify-center" onClick={() => navigate('/dashboard')}>
                                <Home className="h-5 w-5 mr-2" /> Back to Home
                            </Button>
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
        </div>
    );
};

export default BillingPage;
