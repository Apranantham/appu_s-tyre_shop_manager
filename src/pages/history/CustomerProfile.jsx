import React, { useState, useRef } from 'react';
import {
    ArrowLeft,
    Share2,
    MoreVertical,
    Phone,
    MessageSquare,
    Search,
    Calendar,
    Filter,
    CheckCircle2,
    Check,
    Home,
    FileText,
    Download,
    Eye,
    X,
    Trash2,
    Edit3,
    Printer
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useInvoices } from '../../context/InvoiceContext';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../billing/components/InvoiceTemplate';
import Modal from '../../components/ui/Modal';

const CustomerProfile = () => {
    const navigate = useNavigate();
    const { id: customerPhone } = useParams();
    const { getCustomerHistory, deleteInvoice, updateCustomerInfo } = useInvoices();

    const customerInvoices = getCustomerHistory(customerPhone).sort((a, b) => new Date(b.date) - new Date(a.date));
    const mostRecent = customerInvoices[0];

    // Calculate Top Brand
    const brandCounts = {};
    customerInvoices.forEach(inv => {
        inv.items?.forEach(item => {
            if (item.brand && item.brand !== 'N/A') {
                brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
            }
        });
    });
    const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Calculate Spend Growth (Current Month vs Previous Month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthSpend = customerInvoices
        .filter(inv => {
            const d = new Date(inv.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + inv.total, 0);

    const prevMonthSpend = customerInvoices
        .filter(inv => {
            const d = new Date(inv.date);
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        })
        .reduce((sum, inv) => sum + inv.total, 0);

    let spendGrowth = "+0%";
    if (prevMonthSpend > 0) {
        const growth = ((currentMonthSpend - prevMonthSpend) / prevMonthSpend) * 100;
        spendGrowth = `${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`;
    } else if (currentMonthSpend > 0) {
        spendGrowth = "+100%";
    }

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ name: '', phone: '', vehicle: '' });
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });

    if (!mostRecent && customerInvoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-[var(--color-text-gray)]">
                <FileText className="h-16 w-16 mb-4 opacity-20" />
                <h2 className="text-xl font-bold">Customer not found</h2>
                <Button variant="ghost" className="mt-4" onClick={() => navigate('/customers')}>
                    Back to History
                </Button>
            </div>
        );
    }

    const customer = {
        name: mostRecent?.customer?.name || "Customer",
        phone: mostRecent?.customer?.phone || customerPhone,
        car: mostRecent?.customer?.vehicle || "N/A",
        spend: `₹${customerInvoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}`,
        spendGrowth,
        visits: customerInvoices.length,
        lastVisit: mostRecent ? new Date(mostRecent.date).toLocaleDateString() : 'N/A',
        topBrand
    };

    const shareOnWhatsApp = (invoice) => {
        const itemsList = invoice.items.map(item => `- ${item.name} (${item.quantity}x)`).join('%0A');
        const message = `*TurboTyre Central Invoice*%0A%0AHello ${invoice.customer.name}, here is your billing summary:%0A%0A*Invoice ID:* ${invoice.id}%0A*Total:* ₹${invoice.total.toFixed(2)}%0A%0A*Items:*%0A${itemsList}%0A%0AThank you!`;
        const whatsappUrl = `https://wa.me/${invoice.customer.phone.replace(/[^0-9]/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareViaSMS = (invoice) => {
        const message = `TurboTyre: Hello ${invoice.customer.name}, your bill of ₹${invoice.total.toFixed(2)} is paid. Invoice #${invoice.id}. Thank you!`;
        const smsUrl = `sms:${invoice.customer.phone}?body=${message}`;
        window.open(smsUrl);
    };

    const handleEdit = (invoice) => {
        // We pass the invoice data to the billing page via state
        navigate('/billing', { state: { editInvoice: invoice } });
    };

    const handleDelete = () => {
        if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
        }
    };

    const shareProfileSummary = () => {
        const message = `*TurboTyre Customer Profile Summary*%0A%0A*Name:* ${customer.name}%0A*Phone:* ${customer.phone}%0A*Vehicle:* ${customer.car}%0A%0A*Stats:*%0A- Lifetime Spend: ${customer.spend}%0A- Total Visits: ${customer.visits}%0A- Last Visit: ${customer.lastVisit}%0A- Favourite Brand: ${customer.topBrand}%0A%0A_Generated via TurboTyre Central_`;
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    const downloadHistoryCSV = () => {
        const headers = ["Invoice ID", "Date", "Total", "Items"];
        const rows = customerInvoices.map(inv => [
            inv.id,
            new Date(inv.date).toLocaleDateString(),
            inv.total,
            `"${inv.items.map(i => `${i.name}(${i.quantity})`).join('; ')}"`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `history_${customer.phone}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        const oldPhone = customer.phone;
        const newPhone = editData.phone;
        await updateCustomerInfo(oldPhone, editData);
        setShowEditModal(false);
        if (oldPhone !== newPhone) {
            navigate(`/customers/${newPhone}`, { replace: true });
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="text-[var(--color-text-white)]">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold">Customer Profile</h1>
                </div>
                <div className="flex items-center space-x-2 relative">
                    <button
                        onClick={shareProfileSummary}
                        className="p-2 hover:bg-[var(--color-bg-dark)] rounded-full text-[var(--color-text-gray)] hover:text-[#3B82F6] transition-colors"
                        title="Share Profile Summary"
                    >
                        <Share2 className="h-5 w-5" />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className={`p-2 hover:bg-[var(--color-bg-dark)] rounded-full transition-colors ${showOptions ? 'bg-[var(--color-bg-dark)] text-[#3B82F6]' : 'text-[var(--color-text-gray)]'}`}
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>

                        {showOptions && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl mt-2 py-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => {
                                            setEditData({ name: customer.name, phone: customer.phone, vehicle: customer.car });
                                            setShowEditModal(true);
                                            setShowOptions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-bg-dark)] flex items-center"
                                    >
                                        <Edit3 className="h-4 w-4 mr-2" /> Edit Customer
                                    </button>
                                    <button
                                        onClick={() => {
                                            downloadHistoryCSV();
                                            setShowOptions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-bg-dark)] flex items-center"
                                    >
                                        <Download className="h-4 w-4 mr-2" /> Export History (CSV)
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <Card className="rounded-3xl p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-center relative overflow-hidden">
                <div className="relative inline-block mb-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#3B82F6] to-cyan-400 overflow-hidden mx-auto border-4 border-[var(--color-bg-card)] flex items-center justify-center">
                        <span className="text-2xl font-bold text-white uppercase">{customer.name.charAt(0)}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-[var(--color-bg-card)]">
                        <Check className="h-3 w-3" />
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-1">{customer.name}</h2>
                <div className="flex items-center justify-center text-[var(--color-text-gray)] text-sm mb-1">
                    <Phone className="h-3 w-3 mr-1" />
                    {customer.phone}
                </div>
                <div className="text-[var(--color-text-gray)] text-sm mb-6 uppercase tracking-wider font-mono bg-[var(--color-bg-dark)] inline-block px-3 py-1 rounded-full border border-[var(--color-border)]">
                    {customer.car}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button className="w-full bg-[#3B82F6] hover:bg-blue-600 rounded-xl py-6 shadow-lg shadow-blue-500/20" onClick={() => window.open(`tel:${customer.phone}`)}>
                        <Phone className="h-4 w-4 mr-2" /> Call
                    </Button>
                    <Button variant="outline" className="w-full border-[var(--color-border)] hover:bg-[var(--color-bg-dark)] rounded-xl py-6" onClick={() => window.open(`sms:${customer.phone}`)}>
                        <MessageSquare className="h-4 w-4 mr-2" /> Message
                    </Button>
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="space-y-4">
                <Card className="rounded-3xl p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-[var(--color-text-gray)] text-xs font-bold uppercase tracking-wider mb-1">LIFETIME SPEND</p>
                    <div className="flex items-baseline space-x-2">
                        <h3 className="text-3xl font-bold text-[#3B82F6]">{customer.spend}</h3>
                        <span className="text-green-500 text-sm font-bold">{customer.spendGrowth}</span>
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-3xl p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-gray)] text-[10px] font-bold uppercase tracking-wider mb-1">TOTAL VISITS</p>
                        <div className="flex items-baseline space-x-2">
                            <h3 className="text-2xl font-bold text-white">{customer.visits}</h3>
                            <span className="text-[var(--color-text-gray)] text-[10px]">Last: {customer.lastVisit}</span>
                        </div>
                    </Card>
                    <Card className="rounded-3xl p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                        <p className="text-[var(--color-text-gray)] text-[10px] font-bold uppercase tracking-wider mb-1">FAV BRAND</p>
                        <div className="flex items-center space-x-1">
                            <h3 className="text-lg font-bold text-white truncate">{customer.topBrand}</h3>
                            <CheckCircle2 className="h-4 w-4 text-[#3B82F6]" />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Timeline */}
            <div>
                <div className="flex items-center mb-6">
                    <FileText className="h-5 w-5 mr-2 text-[#3B82F6]" />
                    <h3 className="font-bold text-lg">Billing Records</h3>
                </div>

                <div className="space-y-6 relative pl-4 border-l-2 border-[var(--color-border)] ml-2">
                    {customerInvoices.map((item, index) => (
                        <div key={item.id} className="relative pl-6">
                            <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-[var(--color-bg-dark)] ${index === 0 ? 'bg-[#3B82F6]' : 'bg-[var(--color-text-gray)]'}`}></div>

                            <Card
                                onClick={() => { setSelectedInvoice(item); setShowPreview(true); }}
                                className="rounded-2xl p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] space-y-4 cursor-pointer hover:border-[var(--color-primary)] transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-[#3B82F6] text-sm">
                                            {new Date(item.date).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </h4>
                                        <p className="text-[10px] text-[var(--color-text-gray)] font-mono">Invoice #{item.id}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                            className="p-2 bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)] hover:text-[#3B82F6] transition-colors"
                                            title="Edit Invoice"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInvoiceToDelete(item); }}
                                            className="p-2 bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)] hover:text-red-500 transition-colors"
                                            title="Delete Invoice"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {item.items.map((cartItem, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center">
                                                <span className="text-[var(--color-text-gray)] mr-2">{cartItem.quantity}x</span>
                                                <span className="font-medium line-clamp-1">{cartItem.name}</span>
                                            </div>
                                            <span className="font-bold">₹{(cartItem.price * cartItem.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                                    <div className="text-lg font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">
                                        ₹{item.total.toFixed(2)}
                                    </div>
                                    <div className="flex items-center text-[var(--color-text-gray)] text-[10px] space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="h-3 w-3" />
                                        <span>Click to view details</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoice Preview Modal */}
            {showPreview && selectedInvoice && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPreview(false)}></div>
                    <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] rounded-2xl shadow-2xl">
                        <div className="sticky top-0 right-0 p-4 flex justify-between z-10 bg-[var(--color-bg-card)]/10 backdrop-blur-md">
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    onClick={() => shareOnWhatsApp(selectedInvoice)}
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                >
                                    WhatsApp
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => shareViaSMS(selectedInvoice)}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                >
                                    SMS
                                </Button>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    className="bg-[#3B82F6] text-white"
                                    onClick={() => handlePrint()}
                                >
                                    <Printer className="h-4 w-4 mr-2" /> Print
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0 bg-gray-100 text-gray-900 rounded-full hover:bg-gray-200"
                                    onClick={() => setShowPreview(false)}
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 md:p-8">
                            <InvoiceTemplate invoice={selectedInvoice} showPreview={true} />
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {invoiceToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setInvoiceToDelete(null)}></div>
                    <Card className="relative w-full max-w-sm p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Delete Invoice?</h3>
                            <p className="text-[var(--color-text-gray)] text-sm">This action cannot be undone. Are you sure you want to delete invoice #{invoiceToDelete.id}?</p>
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" className="flex-1" onClick={() => setInvoiceToDelete(null)}>Cancel</Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Customer Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Customer Details"
            >
                <form onSubmit={handleUpdateCustomer} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-text-gray)]">Customer Name</label>
                        <input
                            required
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-text-gray)]">Phone Number</label>
                        <input
                            required
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:opacity-30"
                            placeholder="Phone Number"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-text-gray)]">Vehicle / Model</label>
                        <input
                            required
                            value={editData.vehicle}
                            onChange={(e) => setEditData({ ...editData, vehicle: e.target.value })}
                            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Update All Records</Button>
                    </div>
                </form>
            </Modal>

            {/* Print Template (Hidden from UI, visible only for print) */}
            <InvoiceTemplate ref={printRef} invoice={selectedInvoice} />
        </div>
    );
};

export default CustomerProfile;
