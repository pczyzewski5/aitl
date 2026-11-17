import type { ComponentProps } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

type AlertVariant = 'neutral' | 'error';

const alertVariants = cva(
  'flex flex-col gap-(--space-label-field) rounded-card border bg-card p-(--space-panel) text-sm leading-base break-words',
  {
    variants: {
      variant: {
        neutral: 'border-border text-foreground',
        error: 'border-destructive text-destructive',
      } satisfies Record<AlertVariant, string>,
    },
  },
);

const ALERT_ROLES: Record<AlertVariant, 'status' | 'alert'> = {
  neutral: 'status',
  error: 'alert',
};

interface AlertProps extends ComponentProps<'div'> {
  variant?: AlertVariant;
}

function Alert({ className, variant = 'neutral', ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={ALERT_ROLES[variant]}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('font-semibold', className)} {...props} />;
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('font-normal', className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
export type { AlertProps, AlertVariant };
