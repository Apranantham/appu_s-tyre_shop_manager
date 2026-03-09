import React, { useState } from 'react';
import { Plus, Trash2, Edit2, History, ArrowLeft, Search } from 'lucide-react';
import { useOldItemsMaster } from '../../context/OldItemContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const OldItemsMasterPage = () => {
    const { oldItemsMaster, addMasterItem, updateMasterItem, deleteMasterItem, loading } = useOldItemsMaster();
    const { shopDetails } = useSettings();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];
    const navigate = useNavigate();

    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        await addMasterItem({ name: newItemName.trim() });
        setNewItemName('');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingItem || !editingItem.name.trim()) return;
        await updateMasterItem(editingItem.id, { name: editingItem.name.trim() });
        setEditingItem(null);
    };

    const filteredItems = oldItemsMaster.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-dark)] transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">{t.old_items_master}</h1>
                        <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest opacity-60">Manage Pre-defined Old Parts</p>
                    </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <History className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
            </div>

            <Card className="p-6 bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-dark)] border-[var(--color-primary)]/10">
                <form onSubmit={editingItem ? handleUpdate : handleAdd} className="flex gap-3">
                    <input
                        type="text"
                        value={editingItem ? editingItem.name : newItemName}
                        onChange={(e) => editingItem ? setEditingItem({ ...editingItem, name: e.target.value }) : setNewItemName(e.target.value)}
                        placeholder="Enter item name (e.g., Old Michelin 255/55R18)"
                        className="flex-1 bg-[var(--color-bg-dark)] border-2 border-[var(--color-border)] rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:opacity-40"
                    />
                    <Button
                        type="submit"
                        className="bg-[var(--color-primary)] px-8 font-black uppercase tracking-widest text-xs rounded-xl"
                    >
                        {editingItem ? 'Update' : <Plus className="h-5 w-5" />}
                    </Button>
                    {editingItem && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                            className="rounded-xl px-5"
                        >
                            Cancel
                        </Button>
                    )}
                </form>
            </Card>

            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-gray)]" />
                <input
                    type="text"
                    placeholder="Search pre-defined items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none"
                />
            </div>

            <div className="grid gap-3">
                {loading ? (
                    <div className="text-center py-10 opacity-50">Loading master list...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-10 bg-[var(--color-bg-card)] rounded-2xl border-2 border-dashed border-[var(--color-border)] opacity-50 font-bold uppercase text-xs tracking-widest">
                        No pre-defined items found
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <Card
                            key={item.id}
                            className="p-4 flex items-center justify-between group hover:border-[var(--color-primary)]/30 transition-all bg-[var(--color-bg-card)]/50 backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)]/5 flex items-center justify-center">
                                    <History className="h-5 w-5 text-[var(--color-primary)] opacity-40 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="font-bold text-sm tracking-tight">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingItem(item)}
                                    className="p-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => deleteMasterItem(item.id)}
                                    className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default OldItemsMasterPage;
