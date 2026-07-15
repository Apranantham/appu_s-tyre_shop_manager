import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '../../../utils/cn';

const StatCard = ({ title, value, trend, trendValue, icon: Icon, variant = 'default', className }) => {
    const isPositive = trend === 'up';

    if (variant === 'featured') {
        return (
            <div className={cn(
                "relative p-4 md:p-6 rounded-panel overflow-hidden text-[var(--color-text)]",
                "bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-card",
                className
            )}>
                {/* Molten glow — the hero card carries the brand accent */}
                <div className="absolute inset-0 bg-[radial-gradient(420px_200px_at_85%_-20%,var(--color-primary-soft),transparent_70%)] pointer-events-none" />
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                {/* Background Pattern */}
                <div className="absolute right-0 bottom-0 opacity-[0.06] transform translate-x-1/4 translate-y-1/4 text-primary">
                    <Icon className="h-48 w-48" />
                </div>

                <div className="relative z-10">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-gray)] mb-1">{title}</p>
                    <h3 className="text-4xl font-black tracking-tight mb-2 tabular-nums">{value}</h3>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-pill">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{trendValue}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={cn("relative p-4 md:p-5 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex flex-col justify-between h-full overflow-hidden group", className)}>
                {/* Subtle Background Icon */}
                <div className="absolute right-0 bottom-0 opacity-[0.03] transform translate-x-4 translate-y-4 transition-transform group-hover:scale-110 duration-500">
                    <Icon className="h-24 w-24" />
                </div>

                <div className="relative z-10">
                    <p className="text-[var(--color-text-gray)] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 opacity-60">{title}</p>
                    <h3 className="text-xl md:text-2xl font-black text-[var(--color-text-white)] tracking-tight">{value}</h3>
                </div>
                {trendValue && (
                    <div className={cn("relative z-10 text-[10px] md:text-xs font-black mt-4 uppercase tracking-tighter inline-flex items-center", isPositive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>
                        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {trendValue}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className={cn("border-none md:border hover:border-[var(--color-primary)] transition-colors cursor-pointer group overflow-hidden", className)}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[var(--color-text-gray)] text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold mt-1 group-hover:text-[var(--color-primary)] transition-colors">{value}</h3>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-bg-dark)] text-[var(--color-primary)]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {trendValue && (
                <div className="flex items-center text-sm">
                    <span className={cn(
                        "flex items-center font-medium mr-2",
                        isPositive ? "text-success" : "text-danger"
                    )}>
                        {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                        {trendValue}
                    </span>
                    <span className="text-[var(--color-text-gray)]">vs last month</span>
                </div>
            )}
        </Card>
    );
};

export default StatCard;
