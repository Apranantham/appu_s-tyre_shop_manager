import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../../context/InvoiceContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Users,
    TrendingUp,
    ShoppingCart,
    ShieldCheck,
    UserPlus,
    UserCircle,
    Trash2,
    RefreshCcw
} from 'lucide-react';
import Loader from '../../components/ui/Loader';

import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminPanel = () => {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const { invoices, loading: invoicesLoading } = useInvoices();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const [allUsers, setAllUsers] = React.useState([]);
    const [usersLoading, setUsersLoading] = React.useState(true);

    // Protection: If not admin, bounce back to dashboard
    React.useEffect(() => {
        if (user && !isAdmin) {
            navigate('/dashboard');
        }
    }, [user, isAdmin, navigate]);

    // Fetch all users
    React.useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllUsers(usersData);
            setUsersLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loading = invoicesLoading || usersLoading;

    if (loading) {
        return <Loader text={lang === 'ta' ? 'நிர்வாக தரவு மீட்டெடுக்கப்படுகிறது...' : 'Retrieving administrative data...'} />;
    }

    // Calculate global stats
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalInvoices = invoices.length;

    // Merge users from both 'users' collection and invoice history
    const mergedUsersMap = new Map();

    // 1. Add all synced users from 'users' collection
    allUsers.forEach(u => {
        mergedUsersMap.set(u.id, {
            id: u.id,
            label: u.email || u.name || u.id,
            sales: 0,
            count: 0,
            lastSeen: u.lastLogin?.toDate?.()?.toISOString() || u.createdAt || 'N/A'
        });
    });

    // 2. Add/Merge users from invoice history (captures legacy/unsynced users)
    invoices.forEach(inv => {
        const creatorId = inv.createdBy || 'Unknown';
        const label = inv.creatorEmail || inv.creatorName || creatorId;

        if (!mergedUsersMap.has(creatorId)) {
            mergedUsersMap.set(creatorId, {
                id: creatorId,
                label: label,
                sales: 0,
                count: 0,
                lastSeen: inv.date
            });
        }

        const userData = mergedUsersMap.get(creatorId);
        userData.sales += inv.total;
        userData.count += 1;

        // Update lastSeen if this invoice is newer
        if (userData.lastSeen === 'N/A' || new Date(inv.date) > new Date(userData.lastSeen)) {
            userData.lastSeen = inv.date;
        }
    });

    const usersList = Array.from(mergedUsersMap.values()).sort((a, b) => b.sales - a.sales);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">{t.admin_control_panel}</h1>
                    <p className="text-[var(--color-text-gray)] uppercase tracking-widest text-[10px] opacity-60">{t.global_overview}</p>
                </div>
                <div className="bg-[var(--color-bg-dark)]/50 p-3 rounded-xl border border-[var(--color-border)] text-right">
                    <div className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest mb-1">{t.auth_as}</div>
                    <div className="text-xs font-bold text-[var(--color-text)] mb-0.5">{user?.email || 'No Email'}</div>
                    <div className="text-[9px] text-[var(--color-text-gray)] font-mono">{user?.uid}</div>
                </div>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-[var(--color-bg-card)] border-[var(--color-border)] border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{t.global_revenue}</span>
                    </div>
                    <div className="text-2xl font-black">₹{totalRevenue.toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN')}</div>
                    <p className="text-[10px] text-[var(--color-text-gray)] mt-1">{lang === 'ta' ? 'அனைத்து பயனர்களிடமிருந்து' : 'Across all users'}</p>
                </Card>

                <Card className="p-6 bg-[var(--color-bg-card)] border-[var(--color-border)] border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{lang === 'ta' ? 'மொத்த விற்பனை' : 'Total Sales'}</span>
                    </div>
                    <div className="text-2xl font-black">{totalInvoices}</div>
                    <p className="text-[10px] text-[var(--color-text-gray)] mt-1">{lang === 'ta' ? 'உருவாக்கப்பட்ட மொத்த பில்கள்' : 'Total invoices generated'}</p>
                </Card>

                <Card className="p-6 bg-[var(--color-bg-card)] border-[var(--color-border)] border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{t.active_staff}</span>
                    </div>
                    <div className="text-2xl font-black">{usersList.length}</div>
                    <p className="text-[10px] text-[var(--color-text-gray)] mt-1">{lang === 'ta' ? 'விற்பனை பதிவு உள்ள பயனர்கள்' : 'Users with sales records'}</p>
                </Card>
            </div>

            {/* Performance by User */}
            <Card className="bg-[var(--color-bg-card)] border-[var(--color-border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-dark)]/50 flex justify-between items-center"> {/* Modified this div to be flex */}
                    <h3 className="font-bold flex items-center uppercase tracking-tighter">
                        <UserCircle className="h-4 w-4 mr-2" /> {t.performance_by_user}
                    </h3>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] border border-red-500/10 shadow-sm transition-all"
                            onClick={() => navigate('/admin/recycle-bin')}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {lang === 'ta' ? 'குப்பைத் தொட்டி' : 'Recycle Bin'}
                        </Button>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2.5 rounded-xl bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-gray)] hover:text-[var(--color-primary)] transition-all active:scale-95 shadow-inner"
                        >
                            <RefreshCcw className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">{t.employee_email}</th>
                                <th className="px-6 py-4">{lang === 'ta' ? 'மொத்த விற்பனை' : 'Total Sales'}</th>
                                <th className="px-6 py-4">{t.history}</th>
                                <th className="px-6 py-4">{t.last_activity}</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {usersList.map((usr) => (
                                <tr key={usr.id} className="hover:bg-[var(--color-bg-dark)] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm tracking-tight">{usr.label}</div>
                                        <div className="text-[10px] text-[var(--color-text-gray)] font-mono opacity-50">{usr.id}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-blue-500">₹{usr.sales.toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN')}</td>
                                    <td className="px-6 py-4 text-sm">{usr.count}</td>
                                    <td className="px-6 py-4 text-xs text-[var(--color-text-gray)]">
                                        {usr.lastSeen !== 'N/A'
                                            ? new Date(usr.lastSeen).toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN')
                                            : 'No Activity'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate('/history', { state: { creatorId: usr.id, creatorLabel: usr.label } })}
                                            className="text-[var(--color-primary)] text-xs font-black uppercase tracking-tighter hover:underline"
                                        >
                                            {t.view_sales}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminPanel;
