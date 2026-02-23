import React from 'react';
import { cn } from '../../utils/cn';

const Skeleton = ({ className, variant = 'rectangle', ...props }) => {
    return (
        <div
            className={cn(
                "animate-pulse bg-[var(--color-bg-dark)] border border-[var(--color-border)] opacity-40",
                variant === 'circle' ? "rounded-full" : "rounded-lg",
                className
            )}
            {...props}
        />
    );
};

export default Skeleton;
