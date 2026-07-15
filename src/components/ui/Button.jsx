import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    isLoading,
    children,
    ...props
}, ref) => {
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover shadow-card',
        secondary: 'bg-secondary text-[var(--color-bg-dark)] font-bold hover:bg-secondary-hover',
        outline: 'border border-[var(--color-border)] text-[var(--color-text-white)] hover:bg-[var(--color-bg-dark)] hover:border-[var(--color-text-gray)]/50',
        ghost: 'text-[var(--color-text-gray)] hover:text-[var(--color-text-white)] hover:bg-[var(--color-bg-dark)]',
        danger: 'bg-danger text-white hover:opacity-90',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10 p-0 flex items-center justify-center',
    };

    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button };
