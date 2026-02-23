import React from 'react';

const Loader = ({ fullScreen = false, text = 'Loading...' }) => {
    const loaderContent = (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-[var(--color-primary)] opacity-30 rounded-full animate-spin [animation-duration:1.5s]"></div>
            </div>
            {text && (
                <p className="text-[10px] font-bold text-[var(--color-text-gray)] uppercase tracking-[0.2em] animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-[var(--color-bg-dark)] flex items-center justify-center">
                {loaderContent}
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center min-h-[400px] w-full">
            {loaderContent}
        </div>
    );
};

export default Loader;
