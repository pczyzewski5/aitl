import type { ComponentProps } from 'react';
import { Input } from '../ui/input';

interface AmountInputProps extends Omit<ComponentProps<typeof Input>, 'type'> {
  suffix: string;
}

function AmountInput({ suffix, ...props }: AmountInputProps) {
  return (
    <div data-slot="amount-input" className="flex items-center gap-(--space-within-group)">
      <Input type="amount" autoComplete="off" {...props} />
      <span data-slot="amount-suffix" className="shrink-0 text-sm leading-base text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}

export { AmountInput };
export type { AmountInputProps };
