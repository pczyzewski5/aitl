import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

type InputType = 'text' | 'email' | 'password' | 'amount';

interface InputProps extends Omit<ComponentProps<'input'>, 'type'> {
  type?: InputType;
}

const NATIVE_TYPES: Record<InputType, 'text' | 'email' | 'password'> = {
  text: 'text',
  email: 'email',
  password: 'password',
  amount: 'text',
};

function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      data-type={type}
      type={NATIVE_TYPES[type]}
      inputMode={type === 'amount' ? 'decimal' : undefined}
      className={cn(
        'h-control w-full min-w-0 rounded-control border border-input bg-card px-2 text-base leading-base text-foreground placeholder:text-muted-foreground md:text-sm',
        'transition-colors duration-(--duration-feedback)',
        'aria-invalid:border-destructive',
        'enabled:read-only:bg-form-surface',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps, InputType };
