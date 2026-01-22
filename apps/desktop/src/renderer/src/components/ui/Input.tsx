/**
 * Input Component
 * 
 * Text input styled according to the design system.
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={clsx(
                        'shadow-sm shadow-black/10',
                        'block w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                        'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
                        error
                            ? 'border-danger-500 focus:ring-danger-500'
                            : 'border-slate-300',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-danger-600">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-slate-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
