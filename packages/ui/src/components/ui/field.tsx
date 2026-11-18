'use client';

import { Children, cloneElement, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Label } from './label';

const DEFAULT_OPTIONAL_TEXT = '(opcjonalne)';

interface ControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

interface FieldProps {
  label: ReactNode;
  children: ReactElement<ControlProps>;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  optionalText?: string;
  id?: string;
  className?: string;
}

function Field({
  label,
  children,
  hint,
  error,
  optional = false,
  optionalText = DEFAULT_OPTIONAL_TEXT,
  id,
  className,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const control = Children.only(children);
  const describedBy = [control.props['aria-describedby'], hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      data-slot="field"
      data-invalid={error ? true : undefined}
      className={cn('flex flex-col gap-(--space-label-field)', className)}
    >
      <Label htmlFor={controlId}>
        {label}
        {optional && (
          <>
            {' '}
            <span className="font-normal text-muted-foreground">{optionalText}</span>
          </>
        )}
      </Label>
      {cloneElement(control, {
        id: controlId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': optional ? undefined : true,
      })}
      {hint && (
        <p id={hintId} data-slot="field-hint" className="text-sm leading-base text-muted-foreground wrap-anywhere">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" data-slot="field-error" className="text-sm leading-base text-destructive wrap-anywhere">
          {error}
        </p>
      )}
    </div>
  );
}

export { Field };
export type { FieldProps };
