import React from 'react';

// Telegram-style initial avatar: each name gets a stable colour from the
// classic seven-colour avatar palette, so a customer always looks the same.
const PALETTE = ['#E17076', '#FAA774', '#A695E7', '#7BC862', '#6EC9CB', '#65AADD', '#EE7AAE'];

const InitialAvatar = ({ name = '', className = 'h-12 w-12', textClass = 'text-lg' }) => {
    const clean = String(name).trim();
    let hash = 0;
    for (let i = 0; i < clean.length; i++) hash = (hash + clean.charCodeAt(i)) % 997;
    const color = PALETTE[hash % PALETTE.length];
    // Spread operator respects code points, so Tamil initials render whole.
    const initial = clean ? [...clean][0].toUpperCase() : '?';

    return (
        <div
            className={`${className} rounded-full flex items-center justify-center shrink-0 text-white font-black ${textClass}`}
            style={{ background: `linear-gradient(180deg, ${color} 0%, ${color}B8 100%)` }}
            aria-hidden="true"
        >
            {initial}
        </div>
    );
};

export default InitialAvatar;
