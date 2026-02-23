import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import BillingItems from './components/BillingItems';
import BillingCart from './components/BillingCart';
import InvoiceTemplate from './components/InvoiceTemplate';
import { useProducts } from '../../context/ProductContext';
import { useInvoices } from '../../context/InvoiceContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { CheckCircle2, Download, MessageSquare, Printer, X, Plus, Home } from 'lucide-react';

const BillingPage = () => {
    const { updateStock } = useProducts();
    const { addInvoice, updateInvoice, deleteInvoice } = useInvoices();
    const location = useLocation();
    const navigate = useNavigate();

    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState({ name: '', phone: '', vehicle: '' });
    const [paymentMode, setPaymentMode] = useState('cash');
    const [lastInvoice, setLastInvoice] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
    const [editingId, setEditingId] = useState(null);
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

    // Handle incoming edit state
    React.useEffect(() => {
        if (location.state?.editInvoice) {
            const { editInvoice } = location.state;
            setCart(editInvoice.items);
            setCustomer(editInvoice.customer);
            setPaymentMode(editInvoice.paymentMode || 'cash');
            setDiscount(editInvoice.discount || 0);
            setEditingId(editInvoice.id);
            setBillingDate(new Date(editInvoice.date).toISOString().split('T')[0]);
            setIsAutoTime(false); // Don't auto-update when editing an old invoice
            setShowCart(true); // Switch to cart view immediately

            // Clear location state to prevent reload on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });

    const addToCart = (item, type) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && i.type === type);
            if (existing) {
                return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, type, quantity: 1 }];
        });
    };

    const updateQuantity = (id, type, change) => {
        setCart(prev => prev.map(i => {
            if (i.id === id && i.type === type) {
                const newQty = Math.max(0, i.quantity + change);
                return { ...i, quantity: newQty };
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

        const invoiceData = {
            id: editingId || Date.now(),
            date: new Date(billingDate).toISOString(),
            customer: { ...customer },
            items: [...cart],
            subtotal,
            discount: Number(discount) || 0,
            total,
            paymentMode
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
        setBillingDate(getLocalDateTime());
    };

    const shareOnWhatsApp = () => {
        if (!lastInvoice) return;
        const itemsList = lastInvoice.items.map(item => `- ${item.name} (${item.quantity}x)`).join('%0A');
        const message = `*TurboTyre Invoice*%0A%0AHello ${lastInvoice.customer.name}, here is your billing summary:%0A%0A*Invoice ID:* ${lastInvoice.id}%0A*Total:* ₹${lastInvoice.total.toFixed(2)}%0A%0A*Items:*%0A${itemsList}%0A%0AThank you!`;
        const whatsappUrl = `https://wa.me/${lastInvoice.customer.phone.replace(/[^0-9]/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareViaSMS = () => {
        if (!lastInvoice) return;
        const message = `TurboTyre: Hello ${lastInvoice.customer.name}, your bill of ₹${lastInvoice.total.toFixed(2)} is paid. Invoice #${lastInvoice.id}. Thank you!`;
        const smsUrl = `sms:${lastInvoice.customer.phone}?body=${message}`;
        window.open(smsUrl);
    };

    const handleEditAfterPaid = () => {
        if (lastInvoice) {
            deleteInvoice(lastInvoice.id);
            setIsCheckoutSuccess(false);
            setLastInvoice(null);
            setShowCart(true);
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden relative pb-20 lg:pb-0">
            {/* Success Overlay */}
            {isCheckoutSuccess && lastInvoice && (
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

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <Button
                                className="flex flex-col items-center justify-center h-24 space-y-2 bg-[#3B82F6] hover:bg-blue-600 rounded-2xl"
                                onClick={() => handlePrint()}
                            >
                                <Printer className="h-6 w-6" />
                                <span>Print Bill</span>
                            </Button>
                            <Button
                                className="flex flex-col items-center justify-center h-24 space-y-2 bg-green-600 hover:bg-green-700 rounded-2xl"
                                onClick={shareOnWhatsApp}
                            >
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                <span>WhatsApp</span>
                            </Button>
                            <Button
                                className="flex flex-col items-center justify-center h-24 space-y-2 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 rounded-2xl border-none"
                                onClick={shareViaSMS}
                            >
                                <MessageSquare className="h-6 w-6" />
                                <span className="text-sm font-bold">Message</span>
                            </Button>
                            <Button
                                className="flex flex-col items-center justify-center h-24 space-y-2 bg-slate-700 hover:bg-slate-600 text-white shadow-lg shadow-slate-900/20 rounded-2xl border-none"
                                onClick={() => handlePrint()}
                            >
                                <Download className="h-6 w-6" />
                                <span className="text-sm font-bold">PDF Bill</span>
                            </Button>
                        </div>

                        <div className="pt-6 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Button className="w-full bg-[var(--color-primary)] py-6 rounded-2xl font-bold flex items-center justify-center" onClick={resetBilling}>
                                    <Plus className="h-5 w-5 mr-2" /> New Bill
                                </Button>
                                <Button variant="outline" className="w-full border-[var(--color-border)] py-6 rounded-2xl font-bold flex items-center justify-center opacity-70 hover:opacity-100" onClick={handleEditAfterPaid}>
                                    <X className="h-5 w-5 mr-2 text-red-500" /> Edit Bill
                                </Button>
                            </div>
                            <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                                <Home className="h-5 w-5 mr-2" /> Back to Home
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Left Side: Items (Search/Grid) */}
            <div className={`w-full lg:w-[70%] h-fit lg:h-full ${showCart ? 'hidden md:block' : 'block'}`}>
                <BillingItems onAddToCart={addToCart} />
            </div>

            {/* Right Side: Cart/Checkout */}
            <div className={`w-full lg:w-[30%] min-h-[500px] lg:h-full flex flex-col ${!showCart ? 'hidden md:block' : 'block'}`}>
                <div className="h-full flex flex-col">
                    <div className="md:hidden flex items-center p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                        <button
                            onClick={() => setShowCart(false)}
                            className="text-[var(--color-primary)] font-bold flex items-center"
                        >
                            <span className="mr-2 text-xl">←</span> Back to Items
                        </button>
                    </div>
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
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Footer Toggle */}
            {!showCart && cart.length > 0 && (
                <div className="md:hidden fixed bottom-24 left-4 right-4 z-40 animate-fade-in">
                    <button
                        onClick={() => setShowCart(true)}
                        className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex justify-between px-6 items-center"
                    >
                        <div className="flex items-center">
                            <div className="bg-[var(--color-bg-card)] text-[var(--color-primary)] rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                                {cart.reduce((sum, i) => sum + i.quantity, 0)}
                            </div>
                            View Bill
                        </div>
                        <span className="text-xl">₹{cartTotal.toFixed(2)} →</span>
                    </button>
                </div>
            )}

            {/* Print Template (Hidden from UI, visible only for print) */}
            {/* Print Template (Hidden from UI, visible only for print) */}
            <InvoiceTemplate ref={componentRef} invoice={lastInvoice} />
        </div>
    );
};

export default BillingPage;
