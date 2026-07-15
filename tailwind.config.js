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
                // rgb(<triplet> / <alpha-value>) lets opacity modifiers work
                // (border-primary/20, bg-success/10, …) while still re-theming
                // from the CSS variables.
                primary: {
                    DEFAULT: 'rgb(var(--rgb-primary) / <alpha-value>)',
                    hover: 'var(--color-primary-hover)',
                    soft: 'var(--color-primary-soft)',
                },
                secondary: {
                    DEFAULT: 'rgb(var(--rgb-secondary) / <alpha-value>)',
                    hover: 'var(--color-secondary-hover)',
                    soft: 'var(--color-secondary-soft)',
                },
                success: { DEFAULT: 'rgb(var(--rgb-success) / <alpha-value>)', soft: 'var(--color-success-soft)' },
                danger: { DEFAULT: 'rgb(var(--rgb-danger) / <alpha-value>)', soft: 'var(--color-danger-soft)' },
                warning: { DEFAULT: 'rgb(var(--rgb-warning) / <alpha-value>)', soft: 'var(--color-warning-soft)' },
                surface: { DEFAULT: 'var(--color-bg-card)', dark: 'var(--color-bg-dark)' },
                ink: { DEFAULT: 'var(--color-text)', muted: 'var(--color-text-muted)' },
                line: 'var(--color-border)',
            },
            fontFamily: {
                sans: ['Inter', 'Noto Sans Tamil', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
            },
            boxShadow: {
                card: 'var(--shadow-card)',
                pop: 'var(--shadow-pop)',
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
