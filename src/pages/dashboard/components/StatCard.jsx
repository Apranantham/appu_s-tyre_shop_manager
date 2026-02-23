import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '../../../utils/cn';

const StatCard = ({ title, value, trend, trendValue, icon: Icon, variant = 'default', className }) => {
    const isPositive = trend === 'up';

    if (variant === 'featured') {
        return (
            <div className={cn("relative p-6 rounded-3xl overflow-hidden bg-gradient-to-br from-[#0284c7] to-[#0c4a6e] text-white", className)}>
                {/* Background Pattern */}
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                    <Icon className="h-48 w-48" />
                </div>

                <div className="relative z-10">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-4xl font-black mb-2">{value}</h3>
                    <div className="flex items-center text-sm font-medium text-blue-100">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>{trendValue} from last month</span>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={cn("p-5 rounded-3xl bg-[var(--color-bg-card)] border-none md:border border-[var(--color-border)] flex flex-col justify-between h-full", className)}>
                <div>
                    <p className="text-[var(--color-text-gray)] text-xs font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-[var(--color-text-white)]">{value}</h3>
                </div>
                {trendValue && (
                    <div className={cn("text-xs font-bold mt-2", isPositive ? "text-[#10B981]" : "text-[#EF4444]")}>
                        {trendValue}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className={cn("hover:border-[var(--color-primary)] transition-colors cursor-pointer group overflow-hidden", className)}>
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
                        isPositive ? "text-green-500" : "text-red-500"
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
