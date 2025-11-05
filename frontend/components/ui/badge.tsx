import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        draft: 'border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
        active: 'border-green-200 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-200',
        paused: 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
        completed: 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200',
        archived: 'border-gray-200 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulse && variant === 'active' && (
        <span className="mr-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };
