'use client';

import { type ComponentProps, useRef } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import X from 'lucide-react/icons/x';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface DialogContentProps extends Omit<ComponentProps<typeof DialogPrimitive.Content>, 'asChild'> {
  closeLabel?: string;
  dismissOnOverlayClick?: boolean;
}

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogContent({
  className,
  children,
  closeLabel,
  dismissOnOverlayClick = true,
  onPointerDownOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: DialogContentProps) {
  const openerRef = useRef<HTMLElement | null>(null);

  const handleOpenAutoFocus: DialogContentProps['onOpenAutoFocus'] = (event) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    onOpenAutoFocus?.(event);
  };

  const handleCloseAutoFocus: DialogContentProps['onCloseAutoFocus'] = (event) => {
    onCloseAutoFocus?.(event);
    const opener = openerRef.current;
    if (!event.defaultPrevented && opener && opener !== document.body) {
      event.preventDefault();
      opener.focus();
    }
  };
  const handlePointerDownOutside: DialogContentProps['onPointerDownOutside'] = (event) => {
    onPointerDownOutside?.(event);
    if (!dismissOnOverlayClick) {
      event.preventDefault();
    }
  };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-(--space-4)"
      >
        <DialogPrimitive.Content
          data-slot="dialog-content"
          data-closable={closeLabel !== undefined || undefined}
          className={cn(
            'group/dialog relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-card border border-border bg-card text-card-foreground',
            className,
          )}
          onPointerDownOutside={handlePointerDownOutside}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
          {...props}
        >
          <div
            data-slot="dialog-body"
            className="flex min-h-0 flex-col gap-(--space-between-groups) overflow-y-auto p-(--space-panel)"
          >
            {children}
          </div>
          {closeLabel === undefined ? null : (
            <DialogPrimitive.Close asChild>
              <Button
                data-slot="dialog-close-button"
                variant="ghost"
                size="icon"
                aria-label={closeLabel}
                className="absolute top-(--space-2) right-(--space-2) bg-card"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-(--space-label-field) group-data-closable/dialog:pr-control', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('min-w-0 text-lg font-semibold leading-base wrap-anywhere', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm leading-base text-muted-foreground wrap-anywhere', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-wrap justify-end gap-(--space-within-group)', className)}
      {...props}
    />
  );
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger };
export type { DialogContentProps };
