import React from 'react';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(({ className, glass = false, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                'rounded-xl p-6',
                glass ? 'glass-panel' : 'bg-[var(--color-bg-card)] border border-[var(--color-border)]',
                'text-[var(--color-text-white)] shadow-sm',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export { Card };
