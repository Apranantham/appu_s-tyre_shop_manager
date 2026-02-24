import React from 'react';
import { useInvoices } from '../../context/InvoiceContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trash2, RefreshCcw, ArrowLeft, History, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/ui/Loader';

const RecycleBin = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { deletedInvoices, loading, restoreInvoice, permanentlyDeleteInvoice } = useInvoices();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    // Protection: If not admin, bounce back
    React.useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard');
        }
    }, [isAdmin, navigate]);

    if (loading) {
        return <Loader text={lang === 'ta' ? 'அகற்றப்பட்ட தரவுகள் மீட்டெடுக்கப்படுகின்றன...' : 'Loading trashed records...'} />;
    }

    const handleRestore = async (id) => {
        if (window.confirm(lang === 'ta' ? 'இந்த விலைப்பட்டியலை மீண்டும் நிலைநிறுத்தலாமா?' : 'Are you sure you want to restore this invoice?')) {
            try {
                await restoreInvoice(id);
                // Success feedback could go here
            } catch (err) {
                alert('Restore failed: ' + err.message);
            }
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm(lang === 'ta' ? 'எச்சரிக்கை: இது தரவுத்தளத்திலிருந்து நிரந்தரமாக நீக்கப்படும்! தொடரலாமா?' : 'WARNING: This will be deleted from the database FOREVER! Proceed?')) {
            try {
                await permanentlyDeleteInvoice(id);
            } catch (err) {
                alert('Delete failed: ' + err.message);
            }
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl"
                        onClick={() => navigate('/admin')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {lang === 'ta' ? 'பின்செல்' : 'Back'}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Trash2 className="h-6 w-6 text-red-500" />
                            {lang === 'ta' ? 'குப்பைத் தொட்டி' : 'Recycle Bin'}
                        </h1>
                        <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest opacity-60">
                            {lang === 'ta' ? 'அகற்றப்பட்ட விலைப்பட்டியல்களை நிர்வகித்தல்' : 'Manage deleted invoices & recovery'}
                        </p>
                    </div>
                </div>
            </div>

            {deletedInvoices.length === 0 ? (
                <Card className="p-12 flex flex-col items-center justify-center space-y-4 bg-[var(--color-bg-card)]/40 border-dashed border-2 border-[var(--color-border)] rounded-[2rem]">
                    <div className="h-20 w-20 rounded-full bg-[var(--color-bg-dark)] flex items-center justify-center">
                        <Trash2 className="h-10 w-10 text-[var(--color-text-gray)] opacity-20" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-lg uppercase tracking-tight">{lang === 'ta' ? 'தொட்டி காலியாக உள்ளது' : 'Bin is Empty'}</p>
                        <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest mt-1">
                            {lang === 'ta' ? 'அகற்றப்பட்ட தரவுகள் எதுவும் இல்லை' : 'No deleted records found'}
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4">
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-[10px] font-bold text-red-500/90 uppercase tracking-widest leading-relaxed">
                            {lang === 'ta'
                                ? 'குறிப்பு: தரவை மீட்டெடுக்கும்போது அதற்கான சரக்கு இருப்பு தானாகவே குறைக்கப்படும்.'
                                : 'Note: Restoring an invoice will automatically deduct the items from your live inventory again.'}
                        </p>
                    </div>

                    <Card className="overflow-hidden border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-[2rem]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--color-bg-dark)] border-b border-[var(--color-border)]">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Invoice</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Customer</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Total</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">Deleted Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {deletedInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-[var(--color-bg-dark)]/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm">#{inv.invoiceNo || inv.id.slice(-6)}</span>
                                                    <span className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest">{new Date(inv.date).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{inv.customer?.name}</span>
                                                    <span className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest">{inv.customer?.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-black text-red-500">₹{inv.total.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{new Date(inv.deletedAt).toLocaleDateString()}</span>
                                                    <span className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest">By: {inv.creatorEmail?.split('@')[0] || 'Staff'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-10 px-4 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                                                        onClick={() => handleRestore(inv.id)}
                                                    >
                                                        <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                                                        Restore
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-10 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                                                        onClick={() => handlePermanentDelete(inv.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                        Burn
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default RecycleBin;
