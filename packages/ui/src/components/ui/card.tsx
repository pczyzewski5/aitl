import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

type CardTitleLevel = 'h2' | 'h3' | 'h4';

interface CardTitleProps extends ComponentProps<'h3'> {
  as?: CardTitleLevel;
}

function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-(--space-card-gap) rounded-card border border-border bg-card p-(--space-panel) text-card-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-wrap items-center justify-between gap-(--space-within-group)', className)}
      {...props}
    />
  );
}

function CardTitle({ as: Heading = 'h3', className, ...props }: CardTitleProps) {
  return (
    <Heading
      data-slot="card-title"
      className={cn('min-w-0 text-base font-semibold leading-base break-words', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('flex flex-col gap-(--space-within-group)', className)} {...props} />;
}

export { Card, CardContent, CardHeader, CardTitle };
export type { CardTitleLevel, CardTitleProps };
