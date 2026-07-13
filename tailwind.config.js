/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                    soft: 'var(--color-primary-soft)',
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                    hover: 'var(--color-secondary-hover)',
                    soft: 'var(--color-secondary-soft)',
                },
                success: { DEFAULT: 'var(--color-success)', soft: 'var(--color-success-soft)' },
                danger: { DEFAULT: 'var(--color-danger)', soft: 'var(--color-danger-soft)' },
                warning: { DEFAULT: 'var(--color-warning)', soft: 'var(--color-warning-soft)' },
                surface: { DEFAULT: 'var(--color-bg-card)', dark: 'var(--color-bg-dark)' },
                ink: { DEFAULT: 'var(--color-text)', muted: 'var(--color-text-muted)' },
                line: 'var(--color-border)',
            },
            // Semantic radius tokens (rounded-control / -card / -panel / -pill).
            // Added alongside Tailwind's defaults so existing classes keep working
            // while components migrate onto the single scale.
            borderRadius: {
                control: 'var(--radius-md)',
                card: 'var(--radius-lg)',
                panel: 'var(--radius-xl)',
                pill: 'var(--radius-full)',
            },
            screens: {
                'xs': '480px',
            }
        },
    },
    plugins: [],
}
