import React, { useState } from 'react';
import { Plus, Settings, Edit2, Trash2, Power } from 'lucide-react';
import { useServices } from '../../context/ServiceContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { ServiceCardSkeleton } from '../../components/ui/SkeletonVariants';

// Icon mapping (simple version)
import { Disc, Activity, Circle, Wind, Wrench } from 'lucide-react';

const iconMap = {
    align: Activity,
    balance: Disc,
    tyre: Circle,
    gas: Wind,
    tool: Wrench
};

const ServiceForm = ({ onSubmit, initialData, onCancel }) => {
    const [formData, setFormData] = useState(initialData || { name: '', price: '', icon: 'tool', category: 'maintenance' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, price: Number(formData.price) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Service Name</label>
                <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Price (₹)</label>
                <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-gray)]">Icon</label>
                <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-dark)] px-3 py-2 text-sm text-[var(--color-text-white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                    <option value="align">Alignment (Activity)</option>
                    <option value="balance">Balancing (Disc)</option>
                    <option value="tyre">Tyre (Circle)</option>
                    <option value="gas">Gas (Wind)</option>
                    <option value="tool">Repair (Tool)</option>
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">Save Service</Button>
            </div>
        </form>
    );
};

const ServicePage = () => {
    const { services, addService, updateService, deleteService, toggleService, loading } = useServices();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);

    const handleAdd = (data) => {
        addService(data);
        setIsModalOpen(false);
    };

    const handleEdit = (data) => {
        updateService(editingService.id, data);
        setEditingService(null);
        setIsModalOpen(false);
    };

    const openEdit = (service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Services</h1>
                    <p className="text-[var(--color-text-gray)]">Manage service offerings and pricing</p>
                </div>
                <Button onClick={() => { setEditingService(null); setIsModalOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Service
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <ServiceCardSkeleton key={i} />
                    ))
                ) : (
                    services.map((service) => {
                        const Icon = iconMap[service.icon] || Wrench;
                        return (
                            <Card key={service.id} className={`group relative p-5 transition-all hover:border-[var(--color-primary)]/50 ${!service.active && 'opacity-60 grayscale'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="h-12 w-12 shrink-0 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-base tracking-tight truncate" title={service.name}>
                                                {service.name}
                                            </h3>
                                            <div className="text-[var(--color-primary)] font-black text-lg">₹{service.price}</div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${service.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-[var(--color-text-gray)]/10 text-[var(--color-text-gray)] border-[var(--color-text-gray)]/20'}`}>
                                            <span className="hidden sm:inline">{service.active ? 'Active' : 'Disabled'}</span>
                                            <span className="sm:hidden">{service.active ? 'A' : 'D'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center justify-between pt-4 border-t border-[var(--color-border)]/30 gap-2">
                                    <div className="flex gap-1 overflow-visible">
                                        <Button size="sm" variant="ghost" onClick={() => openEdit(service)} className="h-9 w-9 sm:h-8 sm:w-auto px-0 sm:px-2 text-xs hover:bg-[var(--color-bg-dark)]">
                                            <Edit2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                                            <span className="hidden sm:inline">Edit</span>
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-8 sm:w-auto px-0 sm:px-2 text-red-500 text-xs hover:bg-red-500/10" onClick={() => deleteService(service.id)}>
                                            <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </Button>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleService(service.id)}
                                        className={`h-9 sm:h-8 px-2 sm:px-3 text-[10px] uppercase font-bold tracking-widest border-2 whitespace-nowrap ${service.active ? 'text-orange-500 border-orange-500/20 hover:bg-orange-500/10' : 'text-green-500 border-green-500/20 hover:bg-green-500/10'}`}
                                    >
                                        <Power className="h-4 w-4 sm:h-3 sm:w-3 sm:mr-1.5" />
                                        <span className="hidden sm:inline">{service.active ? 'Disable' : 'Enable'}</span>
                                    </Button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingService ? 'Edit Service' : 'Add New Service'}
            >
                <ServiceForm
                    initialData={editingService}
                    onSubmit={editingService ? handleEdit : handleAdd}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ServicePage;
