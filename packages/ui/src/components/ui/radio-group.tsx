'use client';

import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cn } from '../../lib/utils';

const DEFAULT_OPTIONAL_TEXT = '(opcjonalne)';
const MAX_HORIZONTAL_OPTIONS = 2;

interface RadioGroupOption {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps
  extends Omit<
    ComponentProps<typeof RadioGroupPrimitive.Root>,
    'children' | 'asChild' | 'orientation' | 'aria-labelledby'
  > {
  legend: ReactNode;
  options: readonly RadioGroupOption[];
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  optionalText?: string;
}

function RadioGroup({
  legend,
  options,
  hint,
  error,
  optional = false,
  optionalText = DEFAULT_OPTIONAL_TEXT,
  id,
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: RadioGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const legendId = `${groupId}-legend`;
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;
  const describedBy = [ariaDescribedBy, hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ');
  const isHorizontal = options.length <= MAX_HORIZONTAL_OPTIONS;

  return (
    <div data-slot="radio-group-container" className="@container flex w-full flex-col gap-(--space-label-field)">
      <RadioGroupPrimitive.Root
        asChild
        id={groupId}
        aria-labelledby={legendId}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        aria-required={optional ? undefined : true}
        {...props}
      >
        <fieldset
          data-slot="radio-group"
          className={cn('group/radio-group m-0 flex min-w-0 flex-col gap-(--space-label-field) border-0 p-0', className)}
        >
          <legend id={legendId} className="p-0 text-sm font-semibold leading-base text-foreground">
            {legend}
            {optional && (
              <>
                {' '}
                <span className="font-normal text-muted-foreground">{optionalText}</span>
              </>
            )}
          </legend>
          <div
            data-slot="radio-group-options"
            className={cn('flex flex-col', isHorizontal && '@sm:flex-row @sm:flex-wrap @sm:gap-x-(--space-between-groups)')}
          >
            {options.map((option) => {
              const textId = `${groupId}-${option.value}-text`;
              const optionHintId = `${groupId}-${option.value}-hint`;

              return (
                <label
                  key={option.value}
                  data-slot="radio-group-target"
                  className={cn(
                    'inline-flex min-h-control min-w-control max-w-full cursor-pointer items-start gap-(--space-within-group) text-sm leading-base text-foreground',
                    'has-disabled:cursor-not-allowed has-disabled:text-muted-foreground',
                  )}
                >
                  <RadioGroupPrimitive.Item
                    data-slot="radio-group-item"
                    value={option.value}
                    disabled={option.disabled}
                    aria-labelledby={textId}
                    aria-describedby={option.hint ? optionHintId : undefined}
                    className={cn(
                      'my-2 flex size-checkbox shrink-0 items-center justify-center rounded-pill border border-input bg-card',
                      'transition-colors duration-(--duration-feedback)',
                      'group-aria-invalid/radio-group:data-[state=unchecked]:border-destructive',
                      'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
                      'disabled:cursor-not-allowed disabled:bg-muted',
                      'data-[state=checked]:disabled:border-muted-foreground data-[state=checked]:disabled:bg-muted-foreground',
                    )}
                  >
                    <RadioGroupPrimitive.Indicator
                      data-slot="radio-group-indicator"
                      className="size-2 rounded-pill bg-primary-foreground"
                    />
                  </RadioGroupPrimitive.Item>
                  <span className="flex flex-col py-2">
                    <span id={textId}>{option.label}</span>
                    {option.hint && (
                      <span id={optionHintId} className="text-sm leading-base text-muted-foreground">
                        {option.hint}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </RadioGroupPrimitive.Root>
      {hint && (
        <p id={hintId} data-slot="radio-group-hint" className="text-sm leading-base text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" data-slot="radio-group-error" className="text-sm leading-base text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export { RadioGroup };
export type { RadioGroupOption, RadioGroupProps };
