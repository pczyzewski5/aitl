import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

afterEach(cleanup);

interface ExampleProps {
  readonly closeLabel?: string;
  readonly dismissOnOverlayClick?: boolean;
  readonly onPointerDownOutside?: (event: Event) => void;
  readonly withDescription?: boolean;
}

function Example({ closeLabel, dismissOnOverlayClick, onPointerDownOutside, withDescription = true }: ExampleProps) {
  return (
    <Dialog>
      <DialogTrigger>Zmień kwotę</DialogTrigger>
      <DialogContent
        closeLabel={closeLabel}
        dismissOnOverlayClick={dismissOnOverlayClick}
        onPointerDownOutside={onPointerDownOutside}
        {...(withDescription ? {} : { 'aria-describedby': undefined })}
      >
        <DialogHeader>
          <DialogTitle>Zmień kwotę od miesiąca</DialogTitle>
          {withDescription ? <DialogDescription>Nowa kwota obowiązuje od wybranego miesiąca.</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Zamknij okno</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const waitForOutsideListener = () => new Promise((resolve) => setTimeout(resolve, 10));

function clickOverlay() {
  const overlay = document.querySelector('[data-slot="dialog-overlay"]') as Element;
  fireEvent.pointerDown(overlay);
  fireEvent.click(overlay);
}

describe('Dialog', () => {
  it('is closed until its trigger is activated', () => {
    render(<Example />);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Zmień kwotę' }).getAttribute('data-slot')).toBe('dialog-trigger');
  });

  it('opens a modal dialog named by its title and described by its description', () => {
    render(<Example />);

    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));
    const actual = screen.getByRole('dialog', { name: 'Zmień kwotę od miesiąca' });

    expect(actual.getAttribute('aria-describedby')).toBe(screen.getByText('Nowa kwota obowiązuje od wybranego miesiąca.').id);
    expect(screen.getByRole('heading', { level: 2, name: 'Zmień kwotę od miesiąca' }).getAttribute('data-slot')).toBe(
      'dialog-title',
    );
  });

  it('can be opened without a description', () => {
    render(<Example withDescription={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));
    const actual = screen.getByRole('dialog', { name: 'Zmień kwotę od miesiąca' });

    expect(actual.hasAttribute('aria-describedby')).toBe(false);
  });

  it('renders a close button named by a prop and closes with it', () => {
    render(<Example closeLabel="Zamknij okno dialogowe" />);
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    const closeButton = screen.getByRole('button', { name: 'Zamknij okno dialogowe' });
    fireEvent.click(closeButton);

    expect(closeButton.getAttribute('data-size')).toBe('icon');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no close button without a label', () => {
    render(<Example />);

    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    expect(screen.getByRole('dialog').hasAttribute('data-closable')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Zamknij okno dialogowe' })).toBeNull();
  });

  it('reserves room for the close button in the header', () => {
    render(<Example closeLabel="Zamknij okno dialogowe" />);

    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    expect(screen.getByRole('dialog').getAttribute('data-closable')).toBe('true');
    expect(screen.getByRole('dialog').querySelector('[data-slot="dialog-header"]')?.className).toContain(
      'group-data-closable/dialog:pr-control',
    );
  });

  it('closes with a close element placed in the footer', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    fireEvent.click(screen.getByRole('button', { name: 'Zamknij okno' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on Escape', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on a click on the overlay by default', async () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));
    await waitForOutsideListener();

    clickOverlay();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('stays open on a click on the overlay when dismissing by overlay is turned off, and still reports it', async () => {
    const onPointerDownOutside = vi.fn();
    render(<Example dismissOnOverlayClick={false} onPointerDownOutside={onPointerDownOutside} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));
    await waitForOutsideListener();

    clickOverlay();
    await waitForOutsideListener();

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
  });

  it('does not close on a click inside the window', async () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));
    await waitForOutsideListener();

    const heading = screen.getByRole('heading', { name: 'Zmień kwotę od miesiąca' });
    fireEvent.pointerDown(heading);
    fireEvent.click(heading);
    await waitForOutsideListener();

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('uses the overlay token, a bordered card surface and no shadow classes', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    const content = screen.getByRole('dialog');

    expect(overlay?.className).toContain('bg-overlay');
    expect(content.className).toContain('border-border');
    expect(content.className).toContain('rounded-card');
    expect(content.className).toContain('bg-card');
    expect(content.className).not.toContain('shadow');
  });

  it('merges a passed class into the window', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="max-w-sm">
          <DialogTitle>Szczegóły</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    const actual = screen.getByRole('dialog', { name: 'Szczegóły' });

    expect(actual.className).toContain('max-w-sm');
    expect(actual.className).not.toContain('max-w-md');
  });

  it('merges classes into header, title, description and footer', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader className="header-extra">
            <DialogTitle className="title-extra">Tytuł</DialogTitle>
            <DialogDescription className="description-extra">Opis</DialogDescription>
          </DialogHeader>
          <DialogFooter className="footer-extra" />
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText('Tytuł').className).toContain('title-extra');
    expect(screen.getByText('Opis').className).toContain('description-extra');
    expect(document.querySelector('[data-slot="dialog-header"]')?.className).toContain('header-extra');
    expect(document.querySelector('[data-slot="dialog-footer"]')?.className).toContain('footer-extra');
  });
});
