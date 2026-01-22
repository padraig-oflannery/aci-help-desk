/**
 * Card Component
 * 
 * Container component for content blocks.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, hoverable, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    'bg-white rounded-card border border-slate-200 shadow-card',
                    hoverable && 'transition-shadow hover:shadow-card-hover cursor-pointer',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx('px-6 py-4 border-b border-slate-200', className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx('px-6 py-4', className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';
