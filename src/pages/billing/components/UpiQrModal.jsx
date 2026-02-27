import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '../../../context/SettingsContext';
import { X, Shield, User, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const UpiQrModal = ({ amount, onClose, shopName, t }) => {
    const { shopDetails } = useSettings();
    const [selectedAccount, setSelectedAccount] = useState(null);

    const adminUpiId = shopDetails?.adminUpiId || '';
    const userUpiId = shopDetails?.userUpiId || '';

    const getUpiLink = (upiId) => {
        const encodedName = encodeURIComponent(shopName || 'Shop');
        return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&cu=INR`;
    };

    const selectedUpiId = selectedAccount === 'admin' ? adminUpiId : selectedAccount === 'user' ? userUpiId : '';
    const upiLink = selectedUpiId ? getUpiLink(selectedUpiId) : '';
    const hasNoUpi = !adminUpiId && !userUpiId;

    return (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-start justify-center py-8 px-4 overflow-y-auto animate-in fade-in duration-200">
            <Card className="max-w-sm w-full p-0 border-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-300 overflow-hidden rounded-[2.5rem] shrink-0">

                {/* Header */}
                <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all active:scale-90 z-20 cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg uppercase tracking-tight">{t?.upi_payment || 'UPI Payment'}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{t?.scan_to_pay || 'Scan to Pay'}</p>
                        </div>
                    </div>
                    <div className="relative z-10 mt-4 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{t?.total_amount || 'Total Amount'}</p>
                        <p className="text-3xl font-black tracking-tight">₹{Number(amount).toLocaleString()}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 bg-[var(--color-bg-card)]">
                    {hasNoUpi ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                                <AlertCircle className="h-8 w-8 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-[var(--color-text)]">{t?.no_upi_configured || 'No UPI ID Configured'}</p>
                                <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-[0.15em] mt-1 opacity-60">
                                    {t?.configure_upi_in_settings || 'Please add UPI IDs in Settings → Payment Settings'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Account Selector */}
                            <div>
                                <p className="text-[10px] font-black text-[var(--color-text-gray)] uppercase tracking-[0.2em] mb-3 opacity-60">{t?.select_account || 'Select Account'}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {userUpiId && (
                                        <button
                                            onClick={() => setSelectedAccount('user')}
                                            className={`p-4 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center gap-2 ${selectedAccount === 'user'
                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                                                : 'border-[var(--color-border)] bg-[var(--color-bg-dark)]/50 hover:border-emerald-500/30'
                                                }`}
                                        >
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedAccount === 'user' ? 'bg-emerald-500 text-white' : 'bg-[var(--color-bg-dark)] text-[var(--color-text-gray)]'
                                                }`}>
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-wide text-[var(--color-text)]">{t?.user_account || 'User'}</p>
                                                <p className="text-[8px] font-bold text-[var(--color-text-gray)] mt-0.5 truncate max-w-[100px] opacity-50">{userUpiId}</p>
                                            </div>
                                        </button>
                                    )}
                                    {adminUpiId && (
                                        <button
                                            onClick={() => setSelectedAccount('admin')}
                                            className={`p-4 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center gap-2 ${selectedAccount === 'admin'
                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                                                : 'border-[var(--color-border)] bg-[var(--color-bg-dark)]/50 hover:border-emerald-500/30'
                                                }`}
                                        >
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedAccount === 'admin' ? 'bg-emerald-500 text-white' : 'bg-[var(--color-bg-dark)] text-[var(--color-text-gray)]'
                                                }`}>
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-wide text-[var(--color-text)]">{t?.admin_account || 'Admin'}</p>
                                                <p className="text-[8px] font-bold text-[var(--color-text-gray)] mt-0.5 truncate max-w-[100px] opacity-50">{adminUpiId}</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* QR Code Display */}
                            {selectedAccount && selectedUpiId ? (
                                <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="bg-white p-5 rounded-3xl shadow-2xl">
                                        <QRCodeSVG
                                            value={upiLink}
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                            bgColor="#FFFFFF"
                                            fgColor="#000000"
                                        />
                                    </div>
                                    <div className="text-center space-y-1.5">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{t?.scan_to_pay || 'Scan to Pay'}</p>
                                        <p className="text-[9px] font-bold text-[var(--color-text-gray)] opacity-50">
                                            {t?.paying_to || 'Paying to'}: <span className="text-[var(--color-text)]">{selectedUpiId}</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <QrCode className="h-12 w-12 text-[var(--color-text-gray)] opacity-20 mx-auto mb-3" />
                                    <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-[0.15em] opacity-50">
                                        {t?.select_account_to_generate || 'Select an account to generate QR code'}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Close Button */}
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 border-[var(--color-border)] hover:bg-[var(--color-bg-dark)]/50"
                    >
                        {t?.close || 'Close'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default UpiQrModal;
