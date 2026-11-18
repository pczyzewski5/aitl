'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { type EntryActionResult, type EntryFailureMessages, settleEntryAction } from './entry-failure';

interface ActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  failures: EntryFailureMessages;
  onConfirm: () => Promise<EntryActionResult>;
  onDone?: () => void;
}

function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  failures,
  onConfirm,
  onDone,
}: ActionConfirmDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();

  const handleOpenChange = (next: boolean) => {
    if (confirming) {
      return;
    }
    setError(undefined);
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError(undefined);
    const result = await settleEntryAction(onConfirm);
    setConfirming(false);
    if (result.ok) {
      onOpenChange(false);
      onDone?.();

      return;
    }
    setError(failures[result.kind]);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirming={confirming}
      onConfirm={handleConfirm}
    >
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </ConfirmDialog>
  );
}

export { ActionConfirmDialog };
export type { ActionConfirmDialogProps };
