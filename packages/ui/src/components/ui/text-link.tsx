import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { cn } from '../../lib/utils';

interface TextLinkProps extends ComponentProps<'a'> {
  asChild?: boolean;
}

function TextLink({ className, asChild = false, ...props }: TextLinkProps) {
  const Component = asChild ? Slot.Root : 'a';

  return (
    <Component
      data-slot="text-link"
      className={cn(
        'rounded-control text-primary underline underline-offset-2 transition-colors duration-(--duration-feedback) hover:text-primary-hover',
        className,
      )}
      {...props}
    />
  );
}

export { TextLink };
export type { TextLinkProps };
