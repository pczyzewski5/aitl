'use client';

import { type ReactNode, useRef } from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  confirming?: boolean;
  children?: ReactNode;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  confirming = false,
  children,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const focusCancel = (event: Event) => {
    event.preventDefault();
    openerRef.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
  };

  const restoreOpenerFocus = (event: Event) => {
    event.preventDefault();
    openerRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dismissOnOverlayClick={false} onOpenAutoFocus={focusCancel} onCloseAutoFocus={restoreOpenerFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-base text-foreground">{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button ref={cancelRef} variant="secondary">
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button variant="destructive" loading={confirming} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
