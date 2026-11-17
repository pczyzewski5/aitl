'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import Check from 'lucide-react/icons/check';
import Minus from 'lucide-react/icons/minus';
import { cn } from '../../lib/utils';

interface CheckboxProps extends Omit<ComponentProps<typeof CheckboxPrimitive.Root>, 'children' | 'asChild'> {
  label?: ReactNode;
}

function Checkbox({ className, label, ...props }: CheckboxProps) {
  const hasLabel = label !== undefined;

  return (
    <label
      data-slot="checkbox-target"
      className={cn(
        'inline-flex min-h-control min-w-control max-w-full cursor-pointer items-start gap-(--space-within-group) text-sm leading-base text-foreground',
        'has-disabled:cursor-not-allowed has-disabled:text-muted-foreground',
        hasLabel ? 'justify-start' : 'justify-center',
      )}
    >
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        className={cn(
          'my-2 flex size-checkbox shrink-0 items-center justify-center rounded-control border border-input bg-card text-primary-foreground',
          'transition-colors duration-(--duration-feedback)',
          'aria-invalid:border-destructive',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
          'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
          'disabled:cursor-not-allowed disabled:bg-muted',
          'data-[state=checked]:disabled:border-muted-foreground data-[state=checked]:disabled:bg-muted-foreground',
          'data-[state=indeterminate]:disabled:border-muted-foreground data-[state=indeterminate]:disabled:bg-muted-foreground',
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center">
          <Check className="size-4 in-data-[state=indeterminate]:hidden" />
          <Minus className="hidden size-4 in-data-[state=indeterminate]:block" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {hasLabel && <span className="py-2">{label}</span>}
    </label>
  );
}

export { Checkbox };
export type { CheckboxProps };
