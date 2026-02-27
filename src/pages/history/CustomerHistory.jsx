import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useInvoices } from '../../context/InvoiceContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CustomerCardSkeleton } from '../../components/ui/SkeletonVariants';

const CustomerHistory = () => {
    const navigate = useNavigate();
    const { invoices, loading } = useInvoices();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const [searchTerm, setSearchTerm] = useState('');

    // Grouping invoices by customer phone to show unique customers
    const customers = Object.values(invoices.reduce((acc, inv) => {
        // Use phone as primary key, fallback to name, then to invoice ID
        const customerKey = inv.customer?.phone || inv.customer?.name || inv.id;

        if (!acc[customerKey] || new Date(inv.date) > new Date(acc[customerKey].date)) {
            acc[customerKey] = inv;
        }
        return acc;
    }, {}));

    const filteredCustomers = customers.filter(inv => {
        const name = (inv?.customer?.name || '').toLowerCase();
        const phone = (inv?.customer?.phone || '').toLowerCase();
        const vehicle = (inv?.customer?.vehicle || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        // If no search term, show everything that has at least SOME data
        if (!searchTerm) return name || phone || vehicle;

        // Match search against any field
        return name.includes(search) || phone.includes(search) || vehicle.includes(search);
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">{t.customers}</h1>
                    <p className="text-[var(--color-text-gray)] uppercase tracking-widest text-[10px] opacity-60">Manage your customer database and records</p>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                <input
                    placeholder={t.search_customer}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <CustomerCardSkeleton key={i} />
                    ))
                ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-[var(--color-text-gray)]">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>{lang === 'ta' ? 'வாடிக்கையாளர்கள் யாரும் இல்லை' : 'No customers found'}</p>
                    </div>
                ) : (
                    filteredCustomers.map((invoice) => {
                        const customerKey = invoice.customer?.phone || invoice.customer?.name || invoice.id;
                        return (
                            <Card
                                key={customerKey}
                                onClick={() => navigate(`/customers/${encodeURIComponent(customerKey)}`)}
                                className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 transition-colors cursor-pointer hover:border-[var(--color-primary)]"
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{invoice.customer.name}</h3>
                                        <div className="flex items-center text-sm text-[var(--color-text-gray)] space-x-4">
                                            <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {t.last_visit}: {new Date(invoice.date).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                                            <span>{invoice.customer.phone}</span>
                                            <span className="uppercase font-mono bg-[var(--color-bg-dark)] px-2 rounded text-xs">{invoice.customer.vehicle}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Total Pending</p>
                                        <p className={cn(
                                            "font-bold text-xl",
                                            invoices
                                                .filter(i => (i.customer?.phone && i.customer?.phone === invoice.customer?.phone) || (i.customer?.name === invoice.customer?.name))
                                                .reduce((sum, i) => sum + (i.balanceAmount || 0), 0) > 0 ? "text-orange-500" : "text-green-500"
                                        )}>
                                            ₹{invoices
                                                .filter(i => (i.customer?.phone && i.customer?.phone === invoice.customer?.phone) || (i.customer?.name === invoice.customer?.name))
                                                .reduce((sum, i) => sum + (i.balanceAmount || 0), 0)
                                                .toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">{t.lifetime_value}</p>
                                        <p className="font-bold text-xl text-[var(--color-primary)]">
                                            ₹{invoices
                                                .filter(i => (i.customer?.phone && i.customer?.phone === invoice.customer?.phone) || (i.customer?.name === invoice.customer?.name))
                                                .reduce((sum, i) => sum + i.total, 0)
                                                .toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">{t.visits}</p>
                                        <p className="font-medium">
                                            {invoices.filter(i => (i.customer?.phone && i.customer?.phone === invoice.customer?.phone) || (i.customer?.name === invoice.customer?.name)).length}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" className="font-black uppercase tracking-tighter text-[10px]">
                                        {t.view_profile} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>

                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default CustomerHistory;
