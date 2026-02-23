import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../../context/InvoiceContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import {
    Users,
    TrendingUp,
    ShoppingCart,
    ShieldCheck,
    UserPlus,
    UserCircle
} from 'lucide-react';
import Loader from '../../components/ui/Loader';

const AdminPanel = () => {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const { invoices, loading } = useInvoices();

    if (loading) {
        return <Loader text="Retrieving administrative data..." />;
    }

    // Protection: If not admin, bounce back to dashboard
    React.useEffect(() => {
        if (user && !isAdmin) {
            navigate('/dashboard');
        }
    }, [user, isAdmin, navigate]);

    // Calculate global stats
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalInvoices = invoices.length;

    // Group invoices by user
    const usersData = invoices.reduce((acc, inv) => {
        const creatorId = inv.createdBy || 'Unknown';
        const label = inv.creatorEmail || inv.creatorName || creatorId;

        if (!acc[creatorId]) {
            acc[creatorId] = {
                id: creatorId,
                label: label,
                sales: 0,
                count: 0,
                lastSeen: inv.date
            };
        }
        acc[creatorId].sales += inv.total;
        acc[creatorId].count += 1;
        if (new Date(inv.date) > new Date(acc[creatorId].lastSeen)) {
            acc[creatorId].lastSeen = inv.date;
        }
        return acc;
    }, {});

    const usersList = Object.values(usersData).sort((a, b) => b.sales - a.sales);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
                    <p className="text-[var(--color-text-gray)]">Global overview and user management</p>
                </div>
                <div className="bg-[var(--color-bg-dark)]/50 p-3 rounded-xl border border-[var(--color-border)] text-right">
                    <div className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest mb-1">Authenticated As</div>
                    <div className="text-xs font-bold text-white mb-0.5">{user?.email || 'No Email'}</div>
                    <div className="text-[9px] text-[var(--color-text-gray)] font-mono">{user?.uid}</div>
                </div>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-[var(--color-bg-card)] border-[var(--color-border)] border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Global Revenue</span>
                    </div>
                    <div className="text-2xl font-black">₹{totalRevenue.toLocaleString()}</div>
                    <p className="text-[10px] text-[var(--color-text-gray)] mt-1">Across all users</p>
                </Card>

                <Card className="p-6 bg-[var(--color-bg-card)] border-[var(--color-border)] border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Total Sales</span>
                    </div>
                    <div className="text-2xl font-black">{totalInvoices}</div>
                    <p className="text-[10px] text-[var(--color-text-gray)] mt-1">Total invoices generated</p>
                </Card>

                <Card className="p-6 bg-[var(--color-bg-card)] border-[var(--color-border)] border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Active Staff</span>
                    </div>
                    <div className="text-2xl font-black">{usersList.length}</div>
                    <p className="text-[10px] text-[var(--color-text-gray)] mt-1">Users with sales records</p>
                </Card>
            </div>

            {/* Performance by User */}
            <Card className="bg-[var(--color-bg-card)] border-[var(--color-border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-dark)]/50">
                    <h3 className="font-bold flex items-center">
                        <UserCircle className="h-4 w-4 mr-2" /> Performance by User (Sales Count)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--color-bg-dark)] text-[var(--color-text-gray)] text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Employee / Email</th>
                                <th className="px-6 py-4">Total Sales</th>
                                <th className="px-6 py-4">Invoices</th>
                                <th className="px-6 py-4">Last Activity</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {usersList.map((usr) => (
                                <tr key={usr.id} className="hover:bg-[var(--color-bg-dark)] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm tracking-tight">{usr.label}</div>
                                        <div className="text-[10px] text-[var(--color-text-gray)] font-mono opacity-50">{usr.id}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-blue-500">₹{usr.sales.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm">{usr.count}</td>
                                    <td className="px-6 py-4 text-xs text-[var(--color-text-gray)]">
                                        {new Date(usr.lastSeen).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate('/history', { state: { creatorId: usr.id, creatorLabel: usr.label } })}
                                            className="text-[var(--color-primary)] text-xs font-bold hover:underline"
                                        >
                                            View Sales
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
