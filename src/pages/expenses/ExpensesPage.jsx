import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Plus, Search, Filter, Trash2, Edit3, X,
    Wallet, Banknote, CreditCard, QrCode, Calendar,
    Zap, Home, Package, Users, Wrench, Truck, Coffee, FileText,
    TrendingDown, ChevronDown
} from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { cn } from '../../utils/cn';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const CATEGORIES = [
    { id: 'rent', label: 'Rent', labelTa: 'வாடகை', icon: Home, color: 'text-purple-500' },
    { id: 'electricity', label: 'Electricity', labelTa: 'மின்சாரம்', icon: Zap, color: 'text-yellow-500' },
    { id: 'stock_purchase', label: 'Stock Purchase', labelTa: 'பொருள் வாங்கல்', icon: Package, color: 'text-blue-500' },
    { id: 'salary', label: 'Salary / Wages', labelTa: 'சம்பளம்', icon: Users, color: 'text-green-500' },
    { id: 'maintenance', label: 'Maintenance', labelTa: 'பராமரிப்பு', icon: Wrench, color: 'text-orange-500' },
    { id: 'transport', label: 'Transport', labelTa: 'போக்குவரத்து', icon: Truck, color: 'text-cyan-500' },
    { id: 'miscellaneous', label: 'Miscellaneous', labelTa: 'இதர செலவு', icon: Coffee, color: 'text-pink-500' },
];

const PAYMENT_MODES = [
    { id: 'cash', icon: Banknote },
    { id: 'card', icon: CreditCard },
    { id: 'upi', icon: QrCode },
];

const DATE_FILTERS = [
    { id: 'all', label: 'All', labelTa: 'அனைத்தும்' },
    { id: 'today', label: 'Today', labelTa: 'இன்று' },
    { id: 'week', label: 'This Week', labelTa: 'இந்த வாரம்' },
    { id: 'month', label: 'This Month', labelTa: 'இந்த மாதம்' },
    { id: 'custom', label: 'Custom', labelTa: 'தேதி தேர்வு' },
];

const getLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const ExpensesPage = () => {
    const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses();
    const { user, isAdmin } = useAuth();
    const { shopDetails } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const [dateFilter, setDateFilter] = useState(location.state?.dateFilter || 'all');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [staffFilter, setStaffFilter] = useState('all');
    const [showStaffFilter, setShowStaffFilter] = useState(false);

    // Fetch staff list for admin
    const [allUsers, setAllUsers] = useState([]);
    React.useEffect(() => {
        if (!isAdmin) return;
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [isAdmin]);

    const staffList = useMemo(() => {
        if (!isAdmin) return [];
        const map = new Map();
        allUsers.forEach(u => map.set(u.id, { id: u.id, label: u.email || u.name || u.id }));
        expenses.forEach(exp => {
            const id = exp.createdBy;
            if (id && !map.has(id)) map.set(id, { id, label: exp.creatorEmail || exp.creatorName || id });
        });
        return Array.from(map.values());
    }, [isAdmin, allUsers, expenses]);

    const selectedStaffLabel = staffFilter === 'all'
        ? (lang === 'ta' ? 'அனைவரும்' : 'All Staff')
        : (staffList.find(s => s.id === staffFilter)?.label || staffFilter);

    // Form state
    const [form, setForm] = useState({
        category: 'stock_purchase',
        customCategory: '',
        description: '',
        amount: '',
        paymentMode: 'cash',
        date: getLocalDateTime()
    });

    const resetForm = () => {
        setForm({ category: 'stock_purchase', customCategory: '', description: '', amount: '', paymentMode: 'cash', date: getLocalDateTime() });
        setEditingExpense(null);
    };

    const openAdd = () => { resetForm(); setShowModal(true); };

    const openEdit = (expense) => {
        setEditingExpense(expense);
        const dateStr = new Date(expense.date).toISOString().slice(0, 16);
        const isCustom = !CATEGORIES.find(c => c.id === expense.category);
        setForm({
            category: isCustom ? 'custom' : expense.category,
            customCategory: isCustom ? expense.category : '',
            description: expense.description || '', amount: expense.amount || '',
            paymentMode: expense.paymentMode || 'cash', date: dateStr
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.amount || Number(form.amount) <= 0) return;
        const categoryName = form.category === 'custom' ? (form.customCategory || 'Other') : form.category;
        const data = {
            category: categoryName, description: form.description,
            amount: Number(form.amount), paymentMode: form.paymentMode,
            date: new Date(form.date).toISOString()
        };
        if (editingExpense) { await updateExpense(editingExpense.id, data); }
        else { await addExpense(data); }
        setShowModal(false);
        resetForm();
    };

    const handleDelete = async () => { if (deleteTarget) { await deleteExpense(deleteTarget.id); setDeleteTarget(null); } };

    // Active filter count
    const activeFilterCount = [
        filterCategory !== 'all',
        dateFilter !== 'all',
        staffFilter !== 'all'
    ].filter(Boolean).length;

    // Filtered expenses
    const filteredExpenses = useMemo(() => {
        const now = new Date();
        const todayStr = now.toDateString();
        const weekStart = getStartOfWeek(now);
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        return expenses.filter(e => {
            // Search
            const matchesSearch = !searchTerm ||
                (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.category || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Category
            if (filterCategory !== 'all' && e.category !== filterCategory) return false;

            // Staff (admin only)
            if (staffFilter !== 'all' && e.createdBy !== staffFilter) return false;

            // Date filter
            if (dateFilter !== 'all') {
                const eDate = new Date(e.date);
                if (dateFilter === 'today' && eDate.toDateString() !== todayStr) return false;
                if (dateFilter === 'week' && eDate < weekStart) return false;
                if (dateFilter === 'month' && (eDate.getMonth() !== thisMonth || eDate.getFullYear() !== thisYear)) return false;
                if (dateFilter === 'custom') {
                    if (customDateFrom && eDate < new Date(customDateFrom + 'T00:00:00')) return false;
                    if (customDateTo && eDate > new Date(customDateTo + 'T23:59:59')) return false;
                }
            }

            return true;
        });
    }, [expenses, searchTerm, filterCategory, staffFilter, dateFilter, customDateFrom, customDateTo]);

    // Filtered total
    const filteredTotal = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [filteredExpenses]);

    // Group by date
    const groupedExpenses = useMemo(() => {
        const groups = {};
        filteredExpenses.forEach(e => {
            const dateKey = new Date(e.date).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(e);
        });
        return groups;
    }, [filteredExpenses, lang]);

    // Category breakdown (from filtered data)
    const categoryBreakdown = useMemo(() => {
        const breakdown = {};
        filteredExpenses.forEach(e => {
            breakdown[e.category] = (breakdown[e.category] || 0) + (e.amount || 0);
        });
        return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    }, [filteredExpenses]);

    const getCategoryInfo = (catId) => {
        return CATEGORIES.find(c => c.id === catId) || {
            label: catId, labelTa: catId, icon: Coffee, color: 'text-gray-500'
        };
    };

    const clearAllFilters = () => {
        setFilterCategory('all');
        setDateFilter('all');
        setStaffFilter('all');
        setCustomDateFrom('');
        setCustomDateTo('');
        setSearchTerm('');
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">
                        {t.expenses || 'Expenses'}
                    </h1>
                    <p className="text-[var(--color-text-gray)] uppercase tracking-widest text-[10px] opacity-60">
                        {t.track_expenses || 'Track and manage your shop expenses'}
                    </p>
                </div>
                <Button
                    onClick={openAdd}
                    className="bg-[#3B82F6] hover:bg-blue-700 text-white rounded-2xl px-5 py-3 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 border-none flex items-center gap-2"
                >
                    <Plus className="h-4 w-4 stroke-[3px]" />
                    {t.add_expense || 'Add Expense'}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-3xl p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-[var(--color-text-gray)] text-xs font-black uppercase tracking-widest mb-1">
                        {activeFilterCount > 0
                            ? (lang === 'ta' ? 'வடிகட்டிய மொத்தம்' : 'Filtered Total')
                            : (t.monthly_expenses || 'Total Expenses')
                        }
                    </p>
                    <h3 className="text-3xl font-bold text-red-500">
                        ₹{filteredTotal.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-[var(--color-text-gray)] mt-1">
                        {filteredExpenses.length} {lang === 'ta' ? 'பதிவுகள்' : 'records'}
                    </p>
                </Card>

                <Card className="rounded-3xl p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] col-span-1 md:col-span-2">
                    <p className="text-[var(--color-text-gray)] text-xs font-black uppercase tracking-widest mb-3">
                        {t.category_breakdown || 'Category Breakdown'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {categoryBreakdown.length === 0 ? (
                            <p className="text-[var(--color-text-gray)] text-sm opacity-50">
                                {lang === 'ta' ? 'செலவுகள் இல்லை' : 'No expenses found'}
                            </p>
                        ) : (
                            categoryBreakdown.map(([cat, amount]) => {
                                const info = getCategoryInfo(cat);
                                const Icon = info.icon;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer",
                                            filterCategory === cat
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-[var(--color-border)] bg-[var(--color-bg-dark)] hover:border-[var(--color-text-gray)]/40"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", info.color)} />
                                        <span className="text-xs font-bold">{lang === 'ta' ? info.labelTa : info.label}</span>
                                        <span className="text-xs font-black text-red-400">₹{amount.toLocaleString()}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                    <input
                        placeholder={t.search_expenses || 'Search expenses...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                {/* Date Filter */}
                <div className="flex bg-[var(--color-bg-dark)] rounded-xl p-1 border border-[var(--color-border)] overflow-x-auto no-scrollbar">
                    {DATE_FILTERS.map(df => (
                        <button
                            key={df.id}
                            onClick={() => setDateFilter(df.id)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all whitespace-nowrap",
                                dateFilter === df.id
                                    ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20"
                                    : "text-[var(--color-text-gray)] hover:text-[var(--color-text-white)]"
                            )}
                        >
                            {lang === 'ta' ? df.labelTa : df.label}
                        </button>
                    ))}
                </div>

                {/* Action Filters Group */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    {/* Category Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                filterCategory !== 'all'
                                    ? "border-blue-500 bg-blue-500/10 text-blue-500"
                                    : "border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-gray)]"
                            )}
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {filterCategory === 'all'
                                    ? (t.all_categories || 'Category')
                                    : (lang === 'ta' ? getCategoryInfo(filterCategory).labelTa : getCategoryInfo(filterCategory).label)
                                }
                            </span>
                            <ChevronDown className="h-3 w-3" />
                        </button>
                        {showCategoryFilter && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowCategoryFilter(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => { setFilterCategory('all'); setShowCategoryFilter(false); }}
                                        className={cn("w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-bg-dark)] transition-colors", filterCategory === 'all' && "text-blue-500")}
                                    >
                                        {t.all_categories || 'All Categories'}
                                    </button>
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { setFilterCategory(cat.id); setShowCategoryFilter(false); }}
                                            className={cn("w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-bg-dark)] transition-colors flex items-center gap-2", filterCategory === cat.id && "text-blue-500")}
                                        >
                                            <cat.icon className={cn("h-4 w-4", cat.color)} />
                                            {lang === 'ta' ? cat.labelTa : cat.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Admin Staff Filter */}
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setShowStaffFilter(!showStaffFilter)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                    staffFilter !== 'all'
                                        ? "border-purple-500 bg-purple-500/10 text-purple-400"
                                        : "border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-gray)]"
                                )}
                            >
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline max-w-[100px] truncate">{selectedStaffLabel}</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            {showStaffFilter && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowStaffFilter(false)}></div>
                                    <div className="absolute right-0 mt-2 w-64 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto">
                                        <button
                                            onClick={() => { setStaffFilter('all'); setShowStaffFilter(false); }}
                                            className={cn("w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-bg-dark)] transition-colors flex items-center gap-2", staffFilter === 'all' && "text-purple-400")}
                                        >
                                            <Users className="h-4 w-4" />
                                            {lang === 'ta' ? 'அனைவரும்' : 'All Staff'}
                                        </button>
                                        <div className="h-px bg-[var(--color-border)] my-1"></div>
                                        {staffList.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => { setStaffFilter(s.id); setShowStaffFilter(false); }}
                                                className={cn("w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-bg-dark)] transition-colors truncate", staffFilter === s.id && "text-purple-400")}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        >
                            <X className="h-3 w-3" />
                            {lang === 'ta' ? 'அழி' : 'Clear'}
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
                <div className="flex flex-wrap gap-3 items-center bg-[var(--color-bg-dark)] p-3 rounded-xl border border-[var(--color-border)]">
                    <Calendar className="h-4 w-4 text-[var(--color-text-gray)]" />
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-[var(--color-text-gray)]">{lang === 'ta' ? 'தொடக்கம்' : 'From'}</label>
                        <input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-[var(--color-text-gray)]">{lang === 'ta' ? 'முடிவு' : 'To'}</label>
                        <input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
            )}

            {/* Expense List */}
            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-12 text-[var(--color-text-gray)]">
                        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20 animate-pulse" />
                        <p className="text-sm">{lang === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...'}</p>
                    </div>
                ) : Object.keys(groupedExpenses).length === 0 ? (
                    <div className="text-center py-16 text-[var(--color-text-gray)]">
                        <Wallet className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg mb-1">
                            {lang === 'ta' ? 'செலவுகள் எதுவும் இல்லை' : 'No expenses found'}
                        </p>
                        <p className="text-sm opacity-60">
                            {activeFilterCount > 0
                                ? (lang === 'ta' ? 'வடிகட்டி அமைப்புகளை மாற்றவும்' : 'Try adjusting your filters')
                                : (lang === 'ta' ? 'செலவுகளை சேர்க்க மேலே உள்ள பொத்தானை அழுத்தவும்' : 'Tap the button above to add your first expense')
                            }
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedExpenses).map(([date, items]) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 mb-3">
                                <Calendar className="h-4 w-4 text-[var(--color-text-gray)]" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)]">{date}</h3>
                                <span className="text-xs font-black text-red-400">
                                    ₹{items.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {items.map(expense => {
                                    const catInfo = getCategoryInfo(expense.category);
                                    const CatIcon = catInfo.icon;
                                    return (
                                        <Card
                                            key={expense.id}
                                            className="rounded-2xl p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-between gap-4 hover:border-[var(--color-primary)]/30 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                                                    "bg-[var(--color-bg-dark)] border border-[var(--color-border)]"
                                                )}>
                                                    <CatIcon className={cn("h-5 w-5", catInfo.color)} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">
                                                        {lang === 'ta' ? catInfo.labelTa : catInfo.label}
                                                    </p>
                                                    {expense.description && (
                                                        <p className="text-xs text-[var(--color-text-gray)] truncate">{expense.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] bg-[var(--color-bg-dark)] px-2 py-0.5 rounded-full">
                                                            {expense.paymentMode}
                                                        </span>
                                                        <span className="text-[9px] text-[var(--color-text-gray)]">
                                                            {new Date(expense.date).toLocaleTimeString(lang === 'ta' ? 'ta-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                        {isAdmin && expense.creatorEmail && (
                                                            <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                                {expense.creatorEmail}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-lg text-red-500">₹{(expense.amount || 0).toLocaleString()}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(expense)} className="p-2 hover:bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)] hover:text-blue-500 transition-colors">
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(expense)} className="p-2 hover:bg-[var(--color-bg-dark)] rounded-lg text-[var(--color-text-gray)] hover:text-red-500 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editingExpense ? (t.edit_expense || 'Edit Expense') : (t.add_expense || 'Add Expense')}
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest">{t.category || 'Category'}</label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setForm({ ...form, category: cat.id })}
                                    className={cn("flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all gap-1.5",
                                        form.category === cat.id ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-500/20" : "border-[var(--color-border)] bg-[var(--color-bg-dark)]/50 hover:border-[var(--color-text-gray)]/40"
                                    )}>
                                    <cat.icon className={cn("h-5 w-5", form.category === cat.id ? "text-blue-600" : cat.color)} />
                                    <span className={cn("text-[9px] font-black uppercase tracking-tighter leading-tight text-center", form.category === cat.id ? "text-blue-600" : "text-[var(--color-text-gray)]")}>
                                        {lang === 'ta' ? cat.labelTa : cat.label}
                                    </span>
                                </button>
                            ))}
                            <button onClick={() => setForm({ ...form, category: 'custom' })}
                                className={cn("flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all gap-1.5",
                                    form.category === 'custom' ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-500/20" : "border-[var(--color-border)] bg-[var(--color-bg-dark)]/50 hover:border-[var(--color-text-gray)]/40"
                                )}>
                                <FileText className={cn("h-5 w-5", form.category === 'custom' ? "text-blue-600" : "text-[var(--color-text-gray)]")} />
                                <span className={cn("text-[9px] font-black uppercase tracking-tighter", form.category === 'custom' ? "text-blue-600" : "text-[var(--color-text-gray)]")}>
                                    {lang === 'ta' ? 'மற்றவை' : 'Custom'}
                                </span>
                            </button>
                        </div>
                        {form.category === 'custom' && (
                            <input placeholder={lang === 'ta' ? 'வகையை உள்ளிடவும்...' : 'Enter category name...'} value={form.customCategory}
                                onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                                className="w-full mt-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[var(--color-text-white)]"
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest">{t.amount || 'Amount'}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-blue-500">₹</span>
                            <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[var(--color-text-white)]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest">{t.description || 'Description'}</label>
                        <input placeholder={lang === 'ta' ? 'விவரம் (விருப்பமானது)...' : 'Description (optional)...'} value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[var(--color-text-white)]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest">{t.payment_mode}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_MODES.map(mode => (
                                <button key={mode.id} onClick={() => setForm({ ...form, paymentMode: mode.id })}
                                    className={cn("flex flex-col items-center justify-center py-3 rounded-xl border transition-all h-14",
                                        form.paymentMode === mode.id ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm ring-2 ring-blue-500/20" : "border-[var(--color-border)] bg-[var(--color-bg-dark)]/50 text-[var(--color-text-gray)]"
                                    )}>
                                    <mode.icon className="h-5 w-5 mb-1" />
                                    <span className="text-[10px] font-black uppercase">{t[mode.id]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[var(--color-text-gray)]/60 uppercase tracking-widest">{t.date || 'Date'}</label>
                        <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[var(--color-text-white)]"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={!form.amount || Number(form.amount) <= 0}
                        className="w-full h-14 bg-[#3B82F6] hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest text-sm border-none mt-2">
                        {editingExpense ? (t.save || 'Save') : (t.add_expense || 'Add Expense')}
                    </Button>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            {deleteTarget && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}></div>
                    <Card className="relative w-full max-w-sm p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{t.delete_expense || 'Delete Expense'}?</h3>
                            <p className="text-[var(--color-text-gray)] text-sm">
                                {lang === 'ta' ? 'இந்த செலவை நீக்கலாமா?' : 'Are you sure you want to delete this expense?'}
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>{t.cancel}</Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700 border-none" onClick={handleDelete}>{t.delete}</Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExpensesPage;
