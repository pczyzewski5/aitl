import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';

afterEach(cleanup);

function renderDialog(overrides: Partial<ConfirmDialogProps> = {}) {
  const props: ConfirmDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Usunąć wpis „Czynsz (przykład)”?',
    description: 'Wpis zniknie z listy, a wynik miesiąca zostanie przeliczony. Tej operacji nie można cofnąć.',
    confirmLabel: 'Usuń wpis',
    cancelLabel: 'Anuluj',
    onConfirm: vi.fn(),
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
}

const waitForOutsideListener = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('names the dialog by its title and describes it by what will happen', () => {
    renderDialog();

    const actual = screen.getByRole('dialog', { name: 'Usunąć wpis „Czynsz (przykład)”?' });

    expect(actual.getAttribute('aria-describedby')).toBe(
      screen.getByText('Wpis zniknie z listy, a wynik miesiąca zostanie przeliczony. Tej operacji nie można cofnąć.').id,
    );
  });

  it('puts the initial focus on the cancel button, not on the destructive one', () => {
    renderDialog();

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Anuluj' }));
  });

  it('uses the secondary variant for cancel and the destructive one for confirm, both named by props', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: 'Anuluj' }).getAttribute('data-variant')).toBe('secondary');
    expect(screen.getByRole('button', { name: 'Usuń wpis' }).getAttribute('data-variant')).toBe('destructive');
  });

  it('calls onConfirm when the confirm button is clicked and does not close by itself', () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Usuń wpis' }));

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('requests closing when the cancel button is clicked without confirming', () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('requests closing on Escape', () => {
    const props = renderDialog();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on a click on the overlay', async () => {
    const props = renderDialog();
    await waitForOutsideListener();

    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as Element;
    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);
    await waitForOutsideListener();

    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('returns the focus to the element that opened it once it closes', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Usuń wpis z listy</button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Usunąć wpis?"
            description="Tej operacji nie można cofnąć."
            confirmLabel="Usuń wpis"
            cancelLabel="Anuluj"
            onConfirm={vi.fn()}
          />
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Usuń wpis z listy' });
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Anuluj' }));

    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no close button in the corner, cancel is the way out', () => {
    renderDialog();

    expect(document.querySelector('[data-slot="dialog-close-button"]')).toBeNull();
  });

  it('marks the confirm button as busy and ignores clicks while confirming', () => {
    const props = renderDialog({ confirming: true, confirmLabel: 'Usuwanie…' });

    const actual = screen.getByRole('button', { name: 'Usuwanie…' });
    fireEvent.click(actual);

    expect(actual.getAttribute('aria-busy')).toBe('true');
    expect(actual.getAttribute('aria-disabled')).toBe('true');
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('keeps the confirm button idle by default', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: 'Usuń wpis' }).hasAttribute('aria-busy')).toBe(false);
  });

  it('renders extra content between the description and the buttons', () => {
    renderDialog({ children: <p>Skutek: usunięte zostaną także oznaczenia „zapłacone”.</p> });

    const actual = screen.getByText('Skutek: usunięte zostaną także oznaczenia „zapłacone”.');

    expect(actual.compareDocumentPosition(screen.getByRole('button', { name: 'Anuluj' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
