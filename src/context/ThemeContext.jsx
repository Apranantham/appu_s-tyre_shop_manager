import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Available accent colors — values live in index.css under [data-accent='…'].
export const ACCENTS = [
    { id: 'amber', label: 'Amber', label_ta: 'ஆம்பர்', swatch: '#FF7A2F' },
    { id: 'blue', label: 'Blue', label_ta: 'நீலம்', swatch: '#4F8DFF' },
    { id: 'violet', label: 'Violet', label_ta: 'ஊதா', swatch: '#8B7CFF' },
    { id: 'emerald', label: 'Emerald', label_ta: 'பச்சை', swatch: '#34D399' },
    { id: 'rose', label: 'Rose', label_ta: 'ரோஜா', swatch: '#FB6F84' },
];

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Per-user accent colour — device-local, like the dark/light choice, so
    // each person's preference never fights the shared shop settings.
    const [accent, setAccent] = useState(() => {
        const saved = localStorage.getItem('accent_color');
        return ACCENTS.some(a => a.id === saved) ? saved : 'amber';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-accent', accent);
        localStorage.setItem('accent_color', accent);
    }, [accent]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, accent, setAccent }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
