import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { translations } from '../../utils/translations';
import { cn } from '../../utils/cn'; // Assuming cn utility is available
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, LogOut, Sun, Moon, Info, Shield, Store, Save, Type, Monitor, Wallet } from 'lucide-react';

const SettingsPage = () => {
    const { user, login, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { shopDetails, updateShopDetails } = useSettings();
    const { isAdmin } = useAuth();
    const lang = shopDetails?.appLanguage || 'ta';
    const t = translations[lang];

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
            const formData = new FormData(e.target);
            const newShopDetails = {
                shopName: formData.get('shopName'),
                shopPhone: formData.get('shopPhone'),
                shopAddress: formData.get('shopAddress'),
            };
            await updateShopDetails(newShopDetails);
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLanguageChange = async (newLang) => {
        await updateShopDetails({ appLanguage: newLang });
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-24 px-4 pt-4">
            {/* Header section with refined typography */}
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight uppercase text-[var(--color-text)] leading-none">
                    {t.settings}
                    <span className="text-[var(--color-primary)] ml-1">.</span>
                </h1>
                <p className="text-[var(--color-text-gray)] text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                    {t.manage_preferences_desc || 'Manage your application preferences and shop information'}
                </p>
            </div>

            {/* Account Section */}
            <Card className="p-8 space-y-8 bg-[var(--color-bg-card)]/40 backdrop-blur-xl border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl relative overflow-hidden group transition-all hover:bg-[var(--color-bg-card)]/60">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000">
                    <User className="h-40 w-40 text-[var(--color-primary)]" />
                </div>

                <div className="flex items-center space-x-3 text-[var(--color-primary)] relative z-10">
                    <div className="h-10 w-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <Shield className="h-5 w-5" />
                    </div>
                    <h2 className="font-black text-xl uppercase tracking-tight">{t.account}</h2>
                </div>

                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-6 relative z-10">
                        <div className="bg-[var(--color-bg-dark)]/50 p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-inner">
                            <Shield className="h-16 w-16 text-[var(--color-text-gray)] opacity-20" />
                        </div>
                        <div className="text-center space-y-4">
                            <div className="space-y-1">
                                <p className="font-black text-[var(--color-text)] text-lg">{t.sign_in_sync_data}</p>
                                <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest">{t.protect_data_firebase}</p>
                            </div>
                            <Button
                                className="bg-white hover:bg-gray-100 text-gray-900 px-10 py-5 h-16 rounded-[1.5rem] flex items-center shadow-2xl transition-all active:scale-95 font-black uppercase tracking-[0.15em] text-xs border-none"
                                onClick={login}
                            >
                                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                {t.continue_with_google}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-[var(--color-bg-dark)]/50 rounded-[2rem] border border-[var(--color-border)] shadow-inner gap-4 relative z-10 transition-all group-hover:bg-[var(--color-bg-dark)]/80">
                        <div className="flex items-center space-x-5">
                            <div className="relative shrink-0">
                                <img src={user.picture} alt={user.name} className="h-16 w-16 aspect-square object-cover rounded-[1.2rem] border-4 border-white/5 active:scale-95 transition-all shadow-xl" />
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-[var(--color-bg-dark)]" />
                            </div>
                            <div>
                                <p className="font-black text-xl text-[var(--color-text)] tracking-tight leading-tight">{user.name}</p>
                                <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest mt-1 opacity-60">{user.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-red-500 hover:bg-red-500/10 h-14 px-8 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] border border-red-500/10 active:scale-95 transition-all shadow-sm hover:shadow-red-500/5 group/logout"
                            onClick={logout}
                        >
                            <LogOut className="h-4 w-4 mr-2 group-hover/logout:-translate-x-1 transition-transform" /> {t.logout}
                        </Button>
                    </div>
                )}
            </Card>

            {/* Shop Profile Section (Admin Only) */}
            {isAdmin && (
                <Card className="p-8 bg-[var(--color-bg-card)]/40 backdrop-blur-xl border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden relative group transition-all hover:bg-[var(--color-bg-card)]/60">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-1000">
                        <Store className="h-32 w-32" />
                    </div>

                    <div className="flex items-center space-x-3 text-[var(--color-primary)] mb-8 relative z-10">
                        <div className="h-10 w-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <Store className="h-5 w-5" />
                        </div>
                        <h2 className="font-black text-xl uppercase tracking-tight">{t.shop_details}</h2>
                    </div>

                    <form onSubmit={handleSaveShopDetails} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-[var(--color-text-gray)]/80 uppercase tracking-[0.2em] block px-1">
                                    {t.app_name}
                                </label>
                                <input
                                    name="shopName"
                                    defaultValue={shopDetails?.shopName}
                                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] shadow-inner transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-gray)]/30"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-[var(--color-text-gray)]/80 uppercase tracking-[0.2em] block px-1">
                                    {t.shop_phone}
                                </label>
                                <input
                                    name="shopPhone"
                                    defaultValue={shopDetails?.shopPhone}
                                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] shadow-inner transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-gray)]/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-[var(--color-text-gray)]/80 uppercase tracking-[0.2em] block px-1">
                                {t.shop_address}
                            </label>
                            <textarea
                                name="shopAddress"
                                defaultValue={shopDetails?.shopAddress}
                                rows={3}
                                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-[2rem] px-5 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] shadow-inner transition-all text-[var(--color-text)] resize-none placeholder:text-[var(--color-text-gray)]/30"
                            />
                        </div>

                        <Button type="submit" className="w-full h-18 py-5 bg-[var(--color-primary)] hover:bg-blue-600 shadow-2xl shadow-blue-500/30 text-[11px] font-black uppercase tracking-[0.25em] rounded-[1.5rem] transition-all active:scale-95 border-none mt-2" disabled={isSaving}>
                            {isSaving ? (
                                <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <Save className="h-5 w-5" />
                                    {t.save}
                                </div>
                            )}
                        </Button>

                        {saveMessage && (
                            <div className={cn(
                                "flex items-center justify-center py-5 px-8 rounded-[1.5rem] border animate-in slide-in-from-top duration-300 shadow-lg",
                                saveMessage.includes('successfully') ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                            )}>
                                <p className="text-[10px] font-black uppercase tracking-[0.1em]">{saveMessage}</p>
                            </div>
                        )}
                    </form>
                </Card>
            )}

            {/* Payment Settings (UPI) Section - Admin Only */}
            {isAdmin && (
                <Card className="p-8 bg-[var(--color-bg-card)]/40 backdrop-blur-xl border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden relative group transition-all hover:bg-[var(--color-bg-card)]/60">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-1000">
                        <Wallet className="h-32 w-32" />
                    </div>

                    <div className="flex items-center space-x-3 text-emerald-500 mb-8 relative z-10">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <h2 className="font-black text-xl uppercase tracking-tight text-[var(--color-text)]">{t.payment_settings || 'Payment Settings'}</h2>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-[0.15em] opacity-60">
                            {t.upi_settings_desc || 'Configure UPI IDs for QR code payments. These can be updated anytime.'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-[var(--color-text-gray)]/80 uppercase tracking-[0.2em] block px-1">
                                    {t.admin_upi_id || 'Admin UPI ID'}
                                </label>
                                <input
                                    type="text"
                                    value={formData.adminUpiId || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, adminUpiId: e.target.value }))}
                                    placeholder="e.g. admin@upi"
                                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-inner transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-gray)]/30"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-[var(--color-text-gray)]/80 uppercase tracking-[0.2em] block px-1">
                                    {t.user_upi_id || 'User UPI ID'}
                                </label>
                                <input
                                    type="text"
                                    value={formData.userUpiId || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, userUpiId: e.target.value }))}
                                    placeholder="e.g. user@upi"
                                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-inner transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-gray)]/30"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={async () => {
                                setIsSaving(true);
                                setSaveMessage('');
                                try {
                                    await updateShopDetails({
                                        adminUpiId: formData.adminUpiId || '',
                                        userUpiId: formData.userUpiId || ''
                                    });
                                    setSaveMessage('UPI settings saved successfully!');
                                    setTimeout(() => setSaveMessage(''), 3000);
                                } catch (error) {
                                    setSaveMessage('Failed to save UPI settings.');
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            className="w-full h-18 py-5 bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30 text-[11px] font-black uppercase tracking-[0.25em] rounded-[1.5rem] transition-all active:scale-95 border-none mt-2"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <Save className="h-5 w-5" />
                                    {t.save_upi || 'Save UPI Settings'}
                                </div>
                            )}
                        </Button>
                    </div>
                </Card>
            )}
            <Card className="p-8 bg-[var(--color-bg-card)]/40 backdrop-blur-xl border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden relative group transition-all hover:bg-[var(--color-bg-card)]/60">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-1000">
                    <Monitor className="h-32 w-32" />
                </div>

                <div className="flex items-center space-x-3 mb-8 relative z-10">
                    <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-[var(--color-text)]">{t.appearance}</h2>
                        <p className="text-[9px] font-bold text-[var(--color-text-gray)] uppercase tracking-[0.2em] opacity-40 mt-0.5">{t.customize_your_view}</p>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    {/* Dark Mode Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-[var(--color-bg-dark)]/40 border border-white/5 shadow-inner">
                        <div>
                            <p className="font-black text-xs uppercase tracking-widest text-[var(--color-text)]">{t.dark_mode}</p>
                            <p className="text-[10px] text-[var(--color-text-gray)] font-medium mt-1 opacity-70">{t.switch_dark_light}</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "w-16 h-9 rounded-full p-1.5 transition-all duration-500 relative shadow-inner overflow-hidden",
                                theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-gray-700'
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-xl flex items-center justify-center",
                                theme === 'dark' ? 'translate-x-[1.75rem]' : 'translate-x-0'
                            )}>
                                {theme === 'dark' ? <Moon className="h-3.5 w-3.5 text-[var(--color-primary)]" /> : <Sun className="h-3.5 w-3.5 text-gray-700" />}
                            </div>
                        </button>
                    </div>

                    {/* Language Selection */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-[var(--color-bg-dark)]/40 border border-white/5 shadow-inner">
                        <div>
                            <p className="font-black text-xs uppercase tracking-widest text-[var(--color-text)]">{t.language}</p>
                            <p className="text-[10px] text-[var(--color-text-gray)] font-medium mt-1 opacity-70">{t.select_preferred_language}</p>
                        </div>
                        <div className="flex bg-[var(--color-bg-dark)] p-1.5 rounded-[1.5rem] border border-[var(--color-border)] shadow-inner">
                            {['ta', 'en'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => handleLanguageChange(l)}
                                    className={cn(
                                        "px-8 py-3 rounded-[1rem] text-[11px] font-black transition-all uppercase tracking-[0.05em]",
                                        shopDetails?.appLanguage === l
                                            ? "bg-[var(--color-primary)] text-white shadow-xl"
                                            : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
                                    )}
                                >
                                    {l === 'ta' ? 'தமிழ்' : 'English'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-[var(--color-bg-dark)]/40 border border-white/5 shadow-inner">
                        <div className="flex-shrink-0">
                            <p className="font-black text-xs uppercase tracking-widest text-[var(--color-text)]">{t.font_size}</p>
                            <p className="text-[10px] text-[var(--color-text-gray)] font-medium mt-1 opacity-70">{t.adjust_text_readability}</p>
                        </div>
                        <div className="flex bg-[var(--color-bg-dark)] p-1.5 rounded-[1.5rem] border border-[var(--color-border)] shadow-inner overflow-x-auto no-scrollbar max-w-full">
                            {['small', 'medium', 'large', 'extra_large'].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => updateShopDetails({ appFontSize: size })}
                                    className={cn(
                                        "px-5 py-3 rounded-[1rem] text-[10px] border border-transparent font-black uppercase tracking-tight transition-all flex flex-col items-center flex-1 min-w-[70px]",
                                        shopDetails?.appFontSize === size
                                            ? "bg-[var(--color-primary)] text-white shadow-xl border-[var(--color-primary)]"
                                            : "text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-white/5"
                                    )}
                                >
                                    <span className="text-xl leading-none transition-transform group-hover:scale-125">
                                        {size === 'small' ? 'T' :
                                            size === 'medium' ? 'TT' :
                                                size === 'large' ? 'TTT' : 'TTTT'}
                                    </span>
                                    <span className="text-[7px] mt-1.5 opacity-60 uppercase tracking-widest font-black">
                                        {size === 'small' ? t.small :
                                            size === 'medium' ? t.medium :
                                                size === 'large' ? t.large : t.extra_large}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* About Section */}
            <Card className="p-8 bg-[var(--color-bg-card)]/40 backdrop-blur-xl border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl relative overflow-hidden group transition-all hover:bg-[var(--color-bg-card)]/40">
                <div className="flex items-center space-x-3 text-[var(--color-text-gray)] mb-8 opacity-60">
                    <div className="h-10 w-10 rounded-2xl bg-[var(--color-text-gray)]/10 flex items-center justify-center">
                        <Info className="h-5 w-5" />
                    </div>
                    <h2 className="font-black text-xl uppercase tracking-tight text-[var(--color-text)]">{t.about_turbotyre || 'ABOUT APPLICATION'}</h2>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)]/50 pb-5">
                        <span className="text-[var(--color-text-gray)] font-bold uppercase tracking-widest text-[10px] opacity-60">App Version</span>
                        <span className="font-black bg-[var(--color-bg-dark)] px-4 py-2 rounded-xl text-[10px] text-[var(--color-primary)] tracking-widest border border-blue-500/10 shadow-inner">
                            V1.5.0 (PREMIUM)
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)]/50 pb-5">
                        <span className="text-[var(--color-text-gray)] font-bold uppercase tracking-widest text-[10px] opacity-60">Licence Status</span>
                        <span className="text-[var(--color-text)] font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                            Commercial
                            <Shield className="h-3 w-3 text-green-500" />
                        </span>
                    </div>
                    <div className="text-center pt-4 space-y-2">
                        <p className="text-[10px] text-[var(--color-text-gray)] font-black uppercase tracking-[0.2em] opacity-40">© 2026 TurboTyre Tech Solutions Inc.</p>
                        <p className="text-[9px] text-[var(--color-primary)] font-black uppercase tracking-[0.3em] opacity-60">Cloud Sync Active</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
