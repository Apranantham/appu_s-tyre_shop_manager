import React from 'react';
import Skeleton from './Skeleton';
import { Card } from './Card';

export const StatSkeleton = () => (
    <Card className="h-44 p-6 flex flex-col justify-between">
        <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10" variant="circle" />
            <Skeleton className="h-4 w-16" />
        </div>
    </Card>
);

export const CompactStatSkeleton = () => (
    <Card className="h-44 p-4 flex flex-col justify-center space-y-4">
        <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10" variant="circle" />
            <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
            </div>
        </div>
        <Skeleton className="h-3 w-12" />
    </Card>
);

export const ProductCardSkeleton = () => (
    <Card className="group relative p-4 flex flex-col space-y-4 transition-all border-[var(--color-border)]">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]/30">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
    </Card>
);

export const ServiceCardSkeleton = () => (
    <Card className="p-5 space-y-5">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="pt-4 border-t border-[var(--color-border)]/30 flex justify-between">
            <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-24" />
        </div>
    </Card>
);

export const TableRowSkeleton = ({ columns = 5 }) => (
    <tr className="border-b border-[var(--color-border)]/10 animate-pulse">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-full max-w-[120px]" />
            </td>
        ))}
    </tr>
);

export const CustomerCardSkeleton = () => (
    <Card className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
        <div className="flex items-start space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <div className="flex space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
        <div className="flex items-center justify-end gap-6 flex-1">
            <div className="space-y-2 items-end flex flex-col">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2 items-end flex flex-col">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-10 w-24" />
        </div>
    </Card>
);
