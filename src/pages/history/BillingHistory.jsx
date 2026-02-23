import React, { useState, useRef, useEffect } from 'react';
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
    ArrowLeft
} from 'lucide-react';
import { useInvoices } from '../../context/InvoiceContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../billing/components/InvoiceTemplate';
import { cn } from '../../utils/cn';
import { TableRowSkeleton } from '../../components/ui/SkeletonVariants';

const BillingHistory = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { invoices, loading } = useInvoices();
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
    const [activeUserFilter, setActiveUserFilter] = useState(location.state?.creatorId || null);
    const [activeUserLabel, setActiveUserLabel] = useState(location.state?.creatorLabel || '');

    const printRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
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
            const search = searchTerm.toLowerCase();

            const matchesSearch = name.includes(search) || phone.includes(search) || id.includes(search);

            if (!matchesSearch) return false;

            if (activeUserFilter && inv.createdBy !== activeUserFilter) return false;

            const invDate = new Date(inv.date);
            const now = new Date();

            if (dateFilter === 'today') {
                return invDate.toDateString() === now.toDateString();
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return invDate >= weekAgo;
            } else if (dateFilter === 'month') {
                return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
            }

            return true;
        });

        return [...filtered].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'date') {
                aVal = new Date(a.date).getTime();
                bVal = new Date(b.date).getTime();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const filteredInvoices = getSortedInvoices();


    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing History</h1>
                    <p className="text-[var(--color-text-gray)]">View and manage all past transactions</p>
                </div>
                <div className="flex space-x-2">
                    {['all', 'today', 'week', 'month'].map(period => (
                        <button
                            key={period}
                            onClick={() => setDateFilter(period)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider border",
                                dateFilter === period
                                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20"
                                    : "bg-[var(--color-bg-dark)] border-[var(--color-border)] text-[var(--color-text-gray)] hover:border-[var(--color-primary)]"
                            )}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {activeUserFilter && (
                <div className="flex items-center space-x-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-4 py-2 rounded-lg border border-[var(--color-primary)]/20">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-bold">Showing sales for: {activeUserLabel}</span>
                    <button
                        onClick={() => { setActiveUserFilter(null); setActiveUserLabel(''); }}
                        className="ml-2 hover:bg-[var(--color-primary)]/20 p-1 rounded-full text-xs"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                <input
                    placeholder="Search invoice #, name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
            </div>

            <Card className="overflow-hidden border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('date')}>
                                    <div className="flex items-center space-x-1">
                                        <span>Date & ID</span>
                                        {sortConfig.key === 'date' && (
                                            <span className="text-[var(--color-primary)]">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Vehicle</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('total')}>
                                    <div className="flex items-center space-x-1">
                                        <span>Total</span>
                                        {sortConfig.key === 'total' && (
                                            <span className="text-[var(--color-primary)]">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRowSkeleton key={i} columns={5} />
                                ))
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-[var(--color-text-gray)]">
                                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-10" />
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-[var(--color-bg-dark)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm tracking-tight">
                                                {new Date(inv.date).toLocaleString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </p>
                                            <p className="text-[10px] text-[var(--color-text-gray)] font-mono">#{inv.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm">{inv.customer?.name || 'Walk-in'}</p>
                                            <p className="text-[10px] text-[var(--color-text-gray)]">{inv.customer?.phone || 'No phone'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className="bg-[var(--color-bg-dark)] px-2 py-1 rounded-full border border-[var(--color-border)] font-mono uppercase">
                                                {inv.customer?.vehicle || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-black text-sm text-[var(--color-primary)]">
                                            ₹{inv.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => { setSelectedInvoice(inv); setShowPreview(true); }}
                                                    className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg text-[var(--color-text-gray)] hover:text-[var(--color-primary)] transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate('/billing', { state: { editInvoice: inv } })}
                                                    className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg text-[var(--color-text-gray)] hover:text-green-500 transition-colors"
                                                    title="Edit"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Preview Modal */}
            {showPreview && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPreview(false)}></div>
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 right-0 p-4 flex justify-end z-10 bg-[var(--color-bg-card)]/5 backdrop-blur-md">
                            <div className="flex space-x-2">
                                <Button size="sm" onClick={handlePrint} className="bg-[#3B82F6] text-white">
                                    <Printer className="h-4 w-4 mr-2" /> Print
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 h-10 w-10 p-0"
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
                </div>
            )}
        </div>
    );
};

export default BillingHistory;
