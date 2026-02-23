import { User, LogOut, Sun, Moon, Info, Shield, Store, Save } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useState, useEffect } from 'react';

const SettingsPage = () => {
    const { user, login, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { shopDetails, updateShopDetails } = useSettings();

    const [formData, setFormData] = useState({
        shopName: '',
        shopAddress: '',
        shopPhone: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (shopDetails) {
            setFormData(shopDetails);
        }
    }, [shopDetails]);

    const handleSaveShopDetails = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage('');
        try {
            await updateShopDetails(formData);
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-24">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-[var(--color-text-gray)]">Manage your account and preferences</p>
            </div>

            {/* Account Section */}
            <Card className="p-6 space-y-6">
                <div className="flex items-center space-x-2 text-[var(--color-primary)] mb-2">
                    <User className="h-5 w-5" />
                    <h2 className="font-bold text-lg">Account</h2>
                </div>

                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="bg-[var(--color-bg-dark)] p-4 rounded-full">
                            <Shield className="h-12 w-12 text-[var(--color-text-gray)] opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold">Sign in to sync your data</p>
                            <p className="text-sm text-[var(--color-text-gray)] mb-4">Protect your billing and inventory data with Google & Firebase</p>
                            <Button
                                className="bg-[#4285F4] hover:bg-[#357ae8] text-white px-8 py-2 rounded-full flex items-center shadow-lg"
                                onClick={login}
                            >
                                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)]">
                        <div className="flex items-center space-x-4">
                            <img src={user.picture} alt={user.name} className="h-12 w-12 rounded-full border-2 border-[var(--color-primary)]" />
                            <div>
                                <p className="font-bold">{user.name}</p>
                                <p className="text-xs text-[var(--color-text-gray)]">{user.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-red-500 hover:text-red-400" onClick={logout}>
                            <LogOut className="h-5 w-5 mr-2" /> Logout
                        </Button>
                    </div>
                )}
            </Card>

            {/* Shop Profile Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 text-[var(--color-primary)]">
                        <Store className="h-5 w-5" />
                        <h2 className="font-bold text-lg text-[var(--color-text-white)]">Shop Profile</h2>
                    </div>
                </div>

                <form onSubmit={handleSaveShopDetails} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Company Name</label>
                        <input
                            type="text"
                            value={formData.shopName}
                            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl h-11 px-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                            placeholder="Your Shop Name"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Shop Address</label>
                        <textarea
                            value={formData.shopAddress}
                            onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl p-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all min-h-[80px]"
                            placeholder="Full Shop Address"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] ml-1">Contact Phone</label>
                        <input
                            type="text"
                            value={formData.shopPhone}
                            onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                            className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl h-11 px-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                            placeholder="+91 00000 00000"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {saveMessage && (
                            <p className={`text-xs font-bold ${saveMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
                                {saveMessage}
                            </p>
                        )}
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="ml-auto bg-[var(--color-primary)] hover:bg-blue-600 rounded-xl px-6"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><Save className="h-4 w-4 mr-2" /> Save Details</>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Appearance Section */}
            <Card className="p-6">
                <div className="flex items-center space-x-2 text-[var(--color-secondary)] mb-6">
                    <Sun className="h-5 w-5" />
                    <h2 className="font-bold text-lg">Appearance</h2>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)]">
                    <div className="flex items-center space-x-3">
                        {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        <div>
                            <p className="font-bold text-sm">Dark Mode</p>
                            <p className="text-[10px] text-[var(--color-text-gray)] font-medium">Switch between dark and light appearance</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-gray-400'}`}
                    >
                        <div className={`w-4 h-4 bg-[var(--color-bg-card)] rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </Card>

            {/* About Section */}
            <Card className="p-6">
                <div className="flex items-center space-x-2 text-[var(--color-text-gray)] mb-6">
                    <Info className="h-5 w-5" />
                    <h2 className="font-bold text-lg text-[var(--color-text-white)]">About TurboTyre</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-4">
                        <span className="text-[var(--color-text-gray)]">App Version</span>
                        <span className="font-mono bg-[var(--color-bg-dark)] px-2 py-0.5 rounded text-xs text-[var(--color-primary)]">v1.3.0 (Firebase Sync)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-4">
                        <span className="text-[var(--color-text-gray)]">Licence</span>
                        <span className="text-white">Commercial</span>
                    </div>
                    <div className="text-center pt-4">
                        <p className="text-xs text-[var(--color-text-gray)] font-medium">© 2026 TurboTyre Tech Solutions. All rights reserved.</p>
                        <p className="text-[10px] text-[var(--color-text-gray)] opacity-50 mt-1">Cloud Sync powered by Firebase</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
