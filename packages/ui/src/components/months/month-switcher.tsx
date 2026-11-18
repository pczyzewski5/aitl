'use client';

import { type ComponentProps, useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { addMonths, compareMonths, formatMonthLabel, type MonthKey } from './month';
import { MONTH_SWITCHER_MESSAGES, type MonthSwitcherMessages } from './month-switcher.messages';

interface MonthSwitcherProps extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
  month: MonthKey;
  onMonthChange: (month: MonthKey) => void;
  min?: MonthKey;
  max?: MonthKey;
  messages?: Partial<MonthSwitcherMessages>;
}

function MonthSwitcher({ month, onMonthChange, min, max, messages, className, ...props }: MonthSwitcherProps) {
  const text = { ...MONTH_SWITCHER_MESSAGES, ...messages };
  const previousReasonId = useId();
  const nextReasonId = useId();
  const previousBlocked = min !== undefined && compareMonths(month, min) <= 0;
  const nextBlocked = max !== undefined && compareMonths(month, max) >= 0;

  const move = (delta: number, blocked: boolean) => {
    if (!blocked) {
      onMonthChange(addMonths(month, delta));
    }
  };

  return (
    <div
      data-slot="month-switcher"
      role="group"
      aria-label={text.groupLabel}
      className={cn('flex items-center justify-center gap-(--space-between-groups)', className)}
      {...props}
    >
      <Button
        variant="secondary"
        size="icon"
        aria-label={text.previousLabel}
        aria-disabled={previousBlocked || undefined}
        aria-describedby={previousBlocked ? previousReasonId : undefined}
        title={previousBlocked ? text.previousDisabledReason : undefined}
        onClick={() => move(-1, previousBlocked)}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </Button>
      <span
        data-slot="month-switcher-label"
        aria-live="polite"
        aria-atomic="true"
        className="min-w-40 text-center text-lg font-semibold leading-base wrap-anywhere"
      >
        {formatMonthLabel(month, text.monthNames)}
      </span>
      <Button
        variant="secondary"
        size="icon"
        aria-label={text.nextLabel}
        aria-disabled={nextBlocked || undefined}
        aria-describedby={nextBlocked ? nextReasonId : undefined}
        title={nextBlocked ? text.nextDisabledReason : undefined}
        onClick={() => move(1, nextBlocked)}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
      {previousBlocked ? (
        <span id={previousReasonId} className="sr-only">
          {text.previousDisabledReason}
        </span>
      ) : null}
      {nextBlocked ? (
        <span id={nextReasonId} className="sr-only">
          {text.nextDisabledReason}
        </span>
      ) : null}
    </div>
  );
}

export { MonthSwitcher };
export type { MonthSwitcherProps };
