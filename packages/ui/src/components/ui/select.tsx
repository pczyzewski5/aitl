import type { ComponentProps } from 'react';
import ChevronDown from 'lucide-react/icons/chevron-down';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<ComponentProps<'select'>, 'children'> {
  options: readonly SelectOption[];
  placeholder?: string;
}

function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <div data-slot="select-wrapper" className="relative w-full min-w-0">
      <select
        data-slot="select"
        className={cn(
          'peer h-control w-full min-w-0 appearance-none truncate rounded-control border border-input bg-card pr-8 pl-2 text-base leading-base text-foreground md:text-sm',
          'transition-colors duration-(--duration-feedback)',
          'aria-invalid:border-destructive',
          'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
          className,
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        data-slot="select-arrow"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-foreground peer-disabled:text-muted-foreground"
      />
    </div>
  );
}

export { Select };
export type { SelectOption, SelectProps };
