/**
 * Badge Component
 * 
 * Status and category badges.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        const variants = {
            default: 'bg-slate-100 text-slate-700',
            primary: 'bg-primary-100 text-primary-700',
            success: 'bg-success-50 text-success-600',
            warning: 'bg-warning-50 text-warning-600',
            danger: 'bg-danger-50 text-danger-600',
            outline: 'bg-transparent border border-slate-300 text-slate-600',
        };

        return (
            <span
                ref={ref}
                className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

// Ticket status badge with appropriate color
interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
        open: { label: 'Open', variant: 'primary' },
        in_progress: { label: 'In Progress', variant: 'warning' },
        waiting_on_employee: { label: 'Waiting', variant: 'warning' },
        resolved: { label: 'Resolved', variant: 'success' },
        closed: { label: 'Closed', variant: 'default' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Priority badge with appropriate color
interface PriorityBadgeProps {
    priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
    const priorityConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
        low: { label: 'Low', variant: 'default' },
        medium: { label: 'Medium', variant: 'warning' },
        high: { label: 'High', variant: 'danger' },
        urgent: { label: 'Urgent', variant: 'danger' },
    };

    const config = priorityConfig[priority] || { label: priority, variant: 'default' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
