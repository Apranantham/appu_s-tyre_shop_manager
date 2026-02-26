import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    FileText,
    Calendar,
    Download,
    Printer,
    Eye,
    X,
    Filter,
    ChevronRight,
    ArrowLeft,
    Trash2,
    CheckCircle,
    Edit3,
    Coins,
    Wallet,
    Info,
    ArrowUpRight
} from 'lucide-react';
import { useInvoices } from '../../context/InvoiceContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../billing/components/InvoiceTemplate';
import { cn } from '../../utils/cn';
import { TableRowSkeleton } from '../../components/ui/SkeletonVariants';

const BillingHistory = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { invoices, loading, deleteInvoice, updateInvoice } = useInvoices();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || 'all'); // 'all', 'paid', 'pending', 'partially_paid'
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
    const [activeUserFilter, setActiveUserFilter] = useState(location.state?.creatorId || null);
    const [activeUserLabel, setActiveUserLabel] = useState(location.state?.creatorLabel || '');
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleAmount, setSettleAmount] = useState(0);
    const [settleDate, setSettleDate] = useState(new Date().toISOString().split('T')[0]);
    const [settleMode, setSettleMode] = useState('cash');

    // Sync user and status filters from navigation state
    useEffect(() => {
        if (location.state?.creatorId) {
            setActiveUserFilter(location.state.creatorId);
            setActiveUserLabel(location.state.creatorLabel || '');
        }
        if (location.state?.statusFilter) {
            setStatusFilter(location.state.statusFilter);
        }
        if (location.state?.dateFilter) {
            setDateFilter(location.state.dateFilter);
        }
    }, [location.state]);


    const printRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getSortedInvoices = () => {
        const filtered = invoices.filter(inv => {
            const name = (inv.customer?.name || '').toLowerCase();
            const phone = (inv.customer?.phone || '').toLowerCase();
            const id = (String(inv.id) || '').toLowerCase();
            const invNo = (String(inv.invoiceNo) || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            const matchesSearch = name.includes(search) || phone.includes(search) || id.includes(search) || invNo.includes(search);
            if (!matchesSearch) return false;

            if (statusFilter !== 'all') {
                if (statusFilter === 'pending' && inv.paymentStatus !== 'pending' && inv.paymentStatus !== 'partially_paid') return false;
                if (statusFilter === 'paid' && inv.paymentStatus !== 'paid') return false;
                if (statusFilter === 'partially_paid' && inv.paymentStatus !== 'partially_paid') return false;
            }

            const invDate = new Date(inv.date);
            const now = new Date();

            if (dateFilter === 'today') {
                if (invDate.toDateString() !== now.toDateString()) return false;
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (invDate < weekAgo) return false;
            } else if (dateFilter === 'month') {
                if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) return false;
            }

            // Admin Panel Filter (View Sales)
            if (activeUserFilter) {
                // Handle 'Unknown' case for legacy invoices
                const invCreator = inv.createdBy || 'Unknown';
                if (invCreator !== activeUserFilter) return false;
            }

            return true;
        });

        return [...filtered].sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;

            if (sortConfig.key === 'date') {
                // Sort by date (newest first by default)
                const aTime = new Date(a.date || 0).getTime();
                const bTime = new Date(b.date || 0).getTime();
                if (aTime !== bTime) {
                    return (aTime - bTime) * direction;
                }
                // Fallback to ID if dates are identical
                return (String(a.id).localeCompare(String(b.id))) * direction;
            }

            let aVal = a[sortConfig.key] || 0;
            let bVal = b[sortConfig.key] || 0;

            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
            return 0;
        });
    };

    const filteredInvoices = getSortedInvoices();


    return (
        <div className="space-y-6 pb-20">
            {/* Header section with title and date filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase text-[var(--color-text-white)]">{t.history}</h1>
                    <p className="text-[var(--color-text-gray)] text-xs font-bold uppercase tracking-widest opacity-60 mt-1">{t.real_time_overview}</p>
                </div>
                <div className="flex bg-[var(--color-bg-dark)] p-1 rounded-2xl border border-[var(--color-border)] overflow-x-auto no-scrollbar shadow-inner">
                    {['all', 'today', 'week', 'month'].map(period => (
                        <button
                            key={period}
                            onClick={() => setDateFilter(period)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                                dateFilter === period
                                    ? "bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20"
                                    : "text-[var(--color-text-gray)] hover:text-[var(--color-primary)]"
                            )}
                        >
                            {period === 'all' ? (lang === 'ta' ? 'அனைத்தும்' : 'ALL') :
                                period === 'today' ? (lang === 'ta' ? 'இன்று' : 'TODAY') :
                                    period === 'week' ? (lang === 'ta' ? 'வாரம்' : 'WEEK') :
                                        (lang === 'ta' ? 'மாதம்' : 'MONTH')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active User Filter Badge */}
            {activeUserFilter && (
                <div className="flex items-center space-x-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-4 py-2 rounded-lg border border-[var(--color-primary)]/20 w-fit">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-bold">{t.showing_sales_for}: {activeUserLabel}</span>
                    <button
                        onClick={() => { setActiveUserFilter(null); setActiveUserLabel(''); }}
                        className="ml-2 hover:bg-[var(--color-primary)]/20 p-1 rounded-full text-xs"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Search and Status Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)] opacity-50" />
                    <input
                        placeholder={lang === 'ta' ? 'தேடு (பில் #, பெயர், போன்)...' : 'Search (Bill #, Name, Phone)...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all placeholder:font-medium"
                    />
                </div>
                <div className="flex bg-[var(--color-bg-dark)] p-1 rounded-2xl border border-[var(--color-border)] overflow-x-auto no-scrollbar shadow-inner">
                    {['all', 'paid', 'pending'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                statusFilter === status
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-blue-500/20"
                                    : "bg-transparent text-[var(--color-text-gray)] border-transparent hover:text-[var(--color-primary)]"
                            )}
                        >
                            {status === 'all' ? (lang === 'ta' ? 'அனைத்தும்' : 'ALL') :
                                status === 'paid' ? (lang === 'ta' ? 'வசூலானது' : 'PAID') :
                                    (lang === 'ta' ? 'மீதி' : 'PENDING')}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="overflow-hidden border-[var(--color-border)] bg-[var(--color-bg-card)]">
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('date')}>
                                    <div className="flex items-center space-x-1">
                                        <span>{lang === 'ta' ? 'தேதி & ஐடி' : 'Date & ID'}</span>
                                        {sortConfig.key === 'date' && (
                                            <span className="text-[var(--color-primary)]">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4">{t.customers}</th>
                                <th className="px-6 py-4">{t.vehicle}</th>
                                <th className="px-6 py-4">{t.status || 'Status'}</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('total')}>
                                    <div className="flex items-center space-x-1">
                                        <span>{t.total_amount}</span>
                                        {sortConfig.key === 'total' && (
                                            <span className="text-[var(--color-primary)]">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRowSkeleton key={i} columns={6} />
                                ))
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-[var(--color-text-gray)]">
                                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-10" />
                                        {lang === 'ta' ? 'பில்கள் எதுவும் இல்லை' : 'No invoices found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-[var(--color-bg-dark)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm tracking-tight text-[var(--color-text-white)]">
                                                {new Date(inv.date).toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px] text-[var(--color-primary)] font-black">
                                                    {inv.invoiceNo ? `#${inv.invoiceNo}` : `#${inv.id}`}
                                                </span>
                                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/30 text-blue-400 font-black uppercase tracking-widest">{inv.paymentMode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm">{inv.customer?.name || (lang === 'ta' ? 'வாடிக்கையாளர்' : 'Walk-in')}</p>
                                            <p className="text-[10px] text-[var(--color-text-gray)]">{inv.customer?.phone || (lang === 'ta' ? 'போன் எண் இல்லை' : 'No phone')}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono uppercase text-gray-400">
                                            {inv.customer?.vehicle || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full border",
                                                inv.paymentStatus === 'paid' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                    inv.paymentStatus === 'partially_paid' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                                                        "bg-red-500/10 border-red-500/20 text-red-500"
                                            )}>
                                                {(inv.paymentStatus || 'unknown').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-sm text-[var(--color-primary)]">₹{inv.total.toFixed(2)}</p>
                                            {inv.paymentStatus !== 'paid' && (
                                                <p className="text-[9px] font-black text-orange-500 mt-0.5 italic">Bal: ₹{(inv.balanceAmount || 0).toLocaleString()}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {inv.paymentStatus !== 'paid' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedInvoice(inv);
                                                            setSettleAmount(inv.balanceAmount || 0);
                                                            setShowSettleModal(true);
                                                        }}
                                                        className="h-8 w-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                                                        title="Settle Payment"
                                                    >
                                                        <Coins className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setSelectedInvoice(inv); setShowPreview(true); }}
                                                    className="p-2 hover:bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)] hover:text-[var(--color-primary)] transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate('/billing', { state: { editInvoice: inv } })}
                                                    className="p-2 hover:bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)] hover:text-green-500"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setInvoiceToDelete(inv)}
                                                    className="p-2 hover:bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)] hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards - Refined) */}
                <div className="md:hidden divide-y divide-[var(--color-border)]">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-6 space-y-4 animate-pulse">
                                <div className="h-3 bg-[var(--color-bg-dark)] rounded-full w-1/4"></div>
                                <div className="h-5 bg-[var(--color-bg-dark)] rounded-full w-3/4"></div>
                                <div className="h-3 bg-[var(--color-bg-dark)] rounded-full w-1/2"></div>
                            </div>
                        ))
                    ) : filteredInvoices.length === 0 ? (
                        <div className="p-20 text-center text-[var(--color-text-gray)]">
                            <FileText className="h-16 w-16 mx-auto mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{lang === 'ta' ? 'பில்கள் எதுவும் இல்லை' : 'No invoices found'}</p>
                        </div>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <div key={inv.id} className="p-5 space-y-5 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-dark)]/50 transition-colors active:scale-[0.99] duration-200">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--color-primary)]/20 uppercase tracking-widest">#{inv.id}</span>
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{new Date(inv.date).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-[var(--color-text-white)] leading-tight tracking-tight">{inv.customer?.name || (lang === 'ta' ? 'வாடிக்கையாளர்' : 'Walk-in')}</h3>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <p className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">{inv.customer?.vehicle || (lang === 'ta' ? 'வண்டி எண் இல்லை' : 'No Vehicle')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-[var(--color-text-white)]">₹{inv.total.toLocaleString()}</p>
                                        <span className={cn(
                                            "inline-block mt-2 text-[8px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg border",
                                            inv.paymentStatus === 'paid' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                inv.paymentStatus === 'partially_paid' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                                                    "bg-red-500/10 border-red-500/20 text-red-500"
                                        )}>
                                            {(inv.paymentStatus || 'unknown').replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <div className="flex gap-2 flex-1">
                                        {inv.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(inv);
                                                    setSettleAmount(inv.balanceAmount || 0);
                                                    setShowSettleModal(true);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                                            >
                                                <Coins className="h-4 w-4" /> {lang === 'ta' ? 'செட்டில்' : 'Settle'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setSelectedInvoice(inv); setShowPreview(true); }}
                                            className={cn(
                                                "flex items-center justify-center bg-[var(--color-bg-dark)] text-gray-400 rounded-2xl border border-[var(--color-border)] active:scale-95 transition-all shadow-sm",
                                                inv.paymentStatus === 'paid' ? "flex-1 py-3" : "w-14 h-11"
                                            )}
                                        >
                                            <Eye className="h-5 w-5" />
                                            {inv.paymentStatus === 'paid' && <span className="ml-2 text-[10px] font-black uppercase tracking-widest">{t.view || 'View'}</span>}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate('/billing', { state: { editInvoice: inv } })}
                                            className="flex items-center justify-center bg-[var(--color-bg-dark)] text-gray-500 w-11 h-11 rounded-2xl border border-[var(--color-border)] active:scale-95 transition-all"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setInvoiceToDelete(inv)}
                                            className="flex items-center justify-center bg-red-500/10 text-red-500 w-11 h-11 rounded-2xl border border-red-500/20 active:scale-95 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Preview Modal */}
            {showPreview && selectedInvoice && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPreview(false)}></div>
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-[var(--color-border)]">
                        <div className="sticky top-0 right-0 p-4 flex justify-end z-10 bg-[var(--color-bg-card)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
                            <div className="flex space-x-2">
                                <Button size="sm" onClick={handlePrint} className="bg-[#3B82F6] text-white rounded-xl px-6">
                                    <Printer className="h-4 w-4 mr-2" /> {t.print}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="bg-gray-800 text-white rounded-xl hover:bg-gray-700 h-10 w-10 p-0"
                                    onClick={() => setShowPreview(false)}
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 md:p-8">
                            <InvoiceTemplate invoice={selectedInvoice} showPreview={true} />
                        </div>
                        <div className="hidden">
                            <InvoiceTemplate ref={printRef} invoice={selectedInvoice} />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {invoiceToDelete && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setInvoiceToDelete(null)}></div>
                    <Card className="relative w-full max-w-sm p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{t.delete}?</h3>
                            <p className="text-[var(--color-text-gray)] text-sm">
                                {lang === 'ta' ? 'இதை மாற்ற முடியாது. இந்த ரசீதை நீக்கலாமா?' : 'This action cannot be undone. Delete invoice?'}
                                <br />
                                <strong>#{invoiceToDelete.id}</strong> - <strong>{invoiceToDelete.customer?.name || (lang === 'ta' ? 'வாடிக்கையாளர்' : 'Walk-in')}</strong>
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setInvoiceToDelete(null)}>{t.cancel}</Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={() => { deleteInvoice(invoiceToDelete.id); setInvoiceToDelete(null); }}>{t.delete}</Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Settle Payment Modal */}
            {showSettleModal && selectedInvoice && createPortal(
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettleModal(false)}></div>
                    <Card className="relative w-full max-w-sm p-6 space-y-6 animate-in zoom-in-95 duration-200 bg-[var(--color-bg-card)] border-orange-500/30">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
                                <Coins className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{lang === 'ta' ? 'பணத்தை செட்டில் செய்க' : 'Settle Payment'}</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Inv #{selectedInvoice.id} • Bal: ₹{(selectedInvoice.balanceAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ta' ? 'தேதி' : 'SETTLEMENT DATE'}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="date"
                                        value={settleDate}
                                        onChange={(e) => setSettleDate(e.target.value)}
                                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-[var(--color-text-white)]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ta' ? 'தொகை' : 'SETTLEMENT AMOUNT'}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-orange-400">₹</span>
                                    <input
                                        type="number"
                                        value={settleAmount}
                                        onChange={(e) => setSettleAmount(Number(e.target.value))}
                                        max={selectedInvoice.balanceAmount}
                                        className="w-full bg-[var(--color-bg-dark)] border border-orange-500/30 rounded-xl pl-9 pr-4 py-4 text-2xl font-black text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ta' ? 'வகை' : 'PAYMENT MODE'}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'cash', label: 'Cash', icon: Coins },
                                        { id: 'card', label: 'Card', icon: Wallet },
                                        { id: 'upi', label: 'UPI', icon: ArrowUpRight }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setSettleMode(mode.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-3 rounded-xl border transition-all",
                                                settleMode === mode.id
                                                    ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                                    : "border-[var(--color-border)] bg-[var(--color-bg-dark)] text-gray-500 hover:border-gray-600"
                                            )}
                                        >
                                            <mode.icon className="h-4 w-4 mb-1" />
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest border-2" onClick={() => setShowSettleModal(false)}>
                                {t.cancel}
                            </Button>
                            <Button
                                className="flex-1 py-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 border-none"
                                onClick={async () => {
                                    const newBalance = (selectedInvoice.balanceAmount || 0) - settleAmount;
                                    const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

                                    const paymentEntry = {
                                        date: settleDate,
                                        amount: settleAmount,
                                        mode: settleMode,
                                        recordedAt: new Date().toISOString()
                                    };

                                    const updatedPayments = [...(selectedInvoice.payments || []), paymentEntry];

                                    await updateInvoice(selectedInvoice.id, {
                                        balanceAmount: Math.max(0, newBalance),
                                        paymentStatus: newStatus,
                                        paidAmount: (selectedInvoice.paidAmount || 0) + settleAmount,
                                        payments: updatedPayments,
                                        isClosed: newStatus === 'paid'
                                    });

                                    setShowSettleModal(false);
                                }}
                            >
                                {lang === 'ta' ? 'சரி' : 'Confirm'}
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {invoiceToDelete && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setInvoiceToDelete(null)}></div>
                    <Card className="relative w-full max-w-sm p-6 space-y-6 text-center animate-in zoom-in-95 duration-200 border border-[var(--color-border)]">
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{t.delete_invoice || 'Delete Invoice'}?</h3>
                            <p className="text-[var(--color-text-gray)] text-sm">{t.delete_invoice_confirm || 'Are you sure you want to delete this invoice?'} #{invoiceToDelete.invoiceNo || invoiceToDelete.id}</p>
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" className="flex-1 py-4 rounded-xl" onClick={() => setInvoiceToDelete(null)}>{t.cancel}</Button>
                            <Button
                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-500/20 border-none"
                                onClick={async () => {
                                    try {
                                        await deleteInvoice(invoiceToDelete.id);
                                        setInvoiceToDelete(null);
                                    } catch (err) {
                                        alert("Delete failed: " + err.message);
                                    }
                                }}
                            >
                                {t.delete}
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BillingHistory;
