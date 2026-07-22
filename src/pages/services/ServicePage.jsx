import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Power, Search, Wrench, Disc, Activity, Circle, Wind } from 'lucide-react';
import { useServices } from '../../context/ServiceContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';
import Modal from '../../components/ui/Modal';
import { SERVICE_GROUPS } from '../../utils/constants';
import { matchesQuery, displayNames } from '../../utils/itemName';
import { ServiceCardSkeleton } from '../../components/ui/SkeletonVariants';

const iconMap = { align: Activity, balance: Disc, tyre: Circle, gas: Wind, tool: Wrench };
const DEFAULT_GROUP = 'Others';

const inputCls = "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

const ServiceForm = ({ onSubmit, initialData, onCancel, t, lang, groups, saving, error }) => {
    const [formData, setFormData] = useState({ name: '', nameAlt: '', price: '', icon: 'tool', group: '', ...(initialData || {}) });
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, price: Number(formData.price), group: (formData.group || '').trim() });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/30 text-danger text-sm font-bold">{error}</div>
            )}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">{t.service_name}</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">
                    {lang === 'ta' ? 'மற்ற மொழி பெயர் (விருப்பம்)' : 'Name in other language (optional)'}
                </label>
                <input value={formData.nameAlt} onChange={(e) => setFormData({ ...formData, nameAlt: e.target.value })}
                    placeholder={lang === 'ta' ? 'English ⇄ தமிழ்' : 'Tamil ⇄ English'} className={inputCls} />
            </div>
            {/* Group: pick an existing one or type a new one (remembered after save) */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">
                    {lang === 'ta' ? 'சேவை குழு' : 'Service Group'}
                </label>
                <input
                    list="service-groups"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    placeholder={lang === 'ta' ? 'தேர்வு செய் அல்லது புதிதாக உள்ளிடு' : 'Pick one or type a new group'}
                    className={inputCls}
                />
                <datalist id="service-groups">
                    {groups.map(g => <option key={g} value={g} />)}
                </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">{t.price} (₹)</label>
                    <input required type="number" inputMode="decimal" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputCls} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text-gray)]">{t.service_icon}</label>
                    <select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className={inputCls}>
                        <option value="align">Alignment</option>
                        <option value="balance">Balancing</option>
                        <option value="tyre">Tyre</option>
                        <option value="gas">Air / Gas</option>
                        <option value="tool">Repair</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>{t.cancel}</Button>
                <Button type="submit" variant="primary" isLoading={saving}>{t.save}</Button>
            </div>
        </form>
    );
};

const ServicePage = () => {
    const { services, addService, updateService, deleteService, toggleService, loading } = useServices();
    const { isAdmin } = useAuth();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const ta = lang === 'ta';
    const t = translations[lang];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');

    // Suggestions = groups already in use + the built-in defaults, deduped.
    const groupSuggestions = useMemo(() => {
        const used = services.map(s => (s.group || '').trim()).filter(Boolean);
        return Array.from(new Set([...used, ...SERVICE_GROUPS]));
    }, [services]);

    // Groups present in the data (for the filter chips).
    const groupsPresent = useMemo(() => {
        const set = new Set(services.map(s => (s.group || '').trim() || DEFAULT_GROUP));
        return Array.from(set).sort();
    }, [services]);

    // Filter + group into sections.
    const sections = useMemo(() => {
        const filtered = services.filter(s =>
            matchesQuery(s, search) &&
            (groupFilter === 'all' || ((s.group || '').trim() || DEFAULT_GROUP) === groupFilter)
        );
        const map = {};
        filtered.forEach(s => {
            const g = (s.group || '').trim() || DEFAULT_GROUP;
            (map[g] = map[g] || []).push(s);
        });
        return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
    }, [services, search, groupFilter]);

    const handleAdd = async (data) => {
        setSaving(true); setError('');
        try { await addService(data); setIsModalOpen(false); }
        catch (e) { console.error(e); setError(ta ? 'சேமிக்க முடியவில்லை.' : 'Could not save. Please try again.'); }
        finally { setSaving(false); }
    };
    const handleEdit = async (data) => {
        setSaving(true); setError('');
        try { await updateService(editingService.id, data); setEditingService(null); setIsModalOpen(false); }
        catch (e) { console.error(e); setError(ta ? 'புதுப்பிக்க முடியவில்லை.' : 'Could not update. Please try again.'); }
        finally { setSaving(false); }
    };
    const openAdd = () => { setEditingService(null); setError(''); setIsModalOpen(true); };
    const openEdit = (service) => { setEditingService(service); setError(''); setIsModalOpen(true); };

    const ServiceCard = ({ service }) => {
        const Icon = iconMap[service.icon] || Wrench;
        const { primary, secondary } = displayNames(service);
        return (
            <Card className={cn(
                "p-4 flex items-center gap-3 border border-[var(--color-border)] rounded-card transition-colors",
                !service.active && 'opacity-55'
            )}>
                <div className="h-10 w-10 shrink-0 rounded-control bg-primary-soft flex items-center justify-center text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate text-[var(--color-text-white)]" title={service.name}>{primary}</h3>
                        {!service.active && <span className="text-[9px] font-black uppercase text-[var(--color-text-gray)] shrink-0">{ta ? 'ஆஃப்' : 'Off'}</span>}
                    </div>
                    {secondary && <p className="text-[11px] text-[var(--color-text-gray)] truncate leading-tight">{secondary}</p>}
                    <p className="text-primary font-black text-base">₹{service.price}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleService(service.id)} title={service.active ? t.disable : t.enable}
                        className={cn('h-9 w-9 flex items-center justify-center rounded-control', service.active ? 'text-warning hover:bg-warning-soft' : 'text-success hover:bg-success-soft')}>
                        <Power className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(service)} title={t.edit}
                        className="h-9 w-9 flex items-center justify-center rounded-control text-[var(--color-text-gray)] hover:text-primary hover:bg-[var(--color-bg-dark)]">
                        <Edit2 className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => { if (window.confirm(ta ? `"${service.name}" நீக்கவா?` : `Delete "${service.name}"?`)) deleteService(service.id); }}
                            title={t.delete}
                            className="h-9 w-9 flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">{t.services}</h1>
                    <p className="text-[var(--color-text-gray)] text-sm">{ta ? 'சேவைகளும் விலைகளும்' : 'Manage services and pricing'}</p>
                </div>
                <Button onClick={openAdd} className="h-11 px-5 rounded-control bg-primary text-white font-black uppercase tracking-wide text-xs shadow-card flex items-center gap-2 shrink-0">
                    <Plus className="h-5 w-5 stroke-[3px]" />
                    <span className="hidden xs:inline">{t.add_service}</span>
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={ta ? 'தமிழ் / English பெயர் தேடு...' : 'Search service (Tamil or English)...'}
                    className="w-full h-12 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-card pl-11 pr-4 text-sm font-semibold focus:outline-none focus:border-primary"
                />
            </div>

            {/* Group filter chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                {[{ id: 'all', label: ta ? 'அனைத்தும்' : 'All' }, ...groupsPresent.map(g => ({ id: g, label: g }))].map(c => (
                    <button key={c.id} onClick={() => setGroupFilter(c.id)}
                        className={cn('shrink-0 px-3.5 py-1.5 rounded-pill text-[11px] font-black uppercase tracking-wide border transition-colors',
                            groupFilter === c.id ? 'bg-primary text-white border-primary' : 'bg-[var(--color-bg-card)] text-[var(--color-text-gray)] border-[var(--color-border)]')}>
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Grouped sections */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
                </div>
            ) : sections.length === 0 ? (
                <div className="py-16 text-center rounded-panel bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border)]">
                    <Wrench className="h-12 w-12 mx-auto mb-3 text-[var(--color-text-gray)] opacity-20" />
                    <p className="text-sm font-bold text-[var(--color-text-gray)]">{ta ? 'சேவைகள் இல்லை' : 'No services found'}</p>
                    <button onClick={openAdd} className="mt-3 text-primary text-xs font-black uppercase tracking-widest">{t.add_service}</button>
                </div>
            ) : (
                <div className="space-y-6">
                    {sections.map(([group, items]) => (
                        <div key={group}>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)]">{group}</h2>
                                <span className="text-[10px] font-bold text-[var(--color-text-gray)]/60">{items.length}</span>
                                <div className="flex-1 h-px bg-[var(--color-border)]" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {items.map(s => <ServiceCard key={s.id} service={s} />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? t.edit_service : t.add_service}>
                <ServiceForm
                    t={t}
                    lang={lang}
                    groups={groupSuggestions}
                    saving={saving}
                    error={error}
                    initialData={editingService}
                    onSubmit={editingService ? handleEdit : handleAdd}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ServicePage;
