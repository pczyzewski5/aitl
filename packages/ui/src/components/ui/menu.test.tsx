import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Menu, type MenuItem } from './menu';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

const DISABLED_REASON = 'Seria ma miesiące w przeszłości, użyj „Zakończ od miesiąca”.';

function buildItems(): { items: MenuItem[]; onEnd: () => void; onChange: () => void; onDelete: () => void } {
  const onEnd = vi.fn();
  const onChange = vi.fn();
  const onDelete = vi.fn();
  const items: MenuItem[] = [
    { id: 'end', label: 'Zakończ od miesiąca', onSelect: onEnd },
    { id: 'change', label: 'Zmień kwotę od miesiąca', onSelect: onChange },
    { id: 'delete', label: 'Usuń całkowicie', onSelect: onDelete, destructive: true },
  ];
  return { items, onEnd, onChange, onDelete };
}

function openWithKeyboard(key: string = 'Enter') {
  const trigger = screen.getByRole('button', { name: 'Akcje serii' });
  trigger.focus();
  fireEvent.keyDown(trigger, { key });
  return trigger;
}

describe('Menu', () => {
  it('renders only the trigger button named by the prop while closed', () => {
    render(<Menu triggerLabel="Akcje serii" items={buildItems().items} />);

    const actual = screen.getByRole('button', { name: 'Akcje serii' });

    expect(actual.getAttribute('aria-haspopup')).toBe('menu');
    expect(actual.getAttribute('aria-expanded')).toBe('false');
    expect(actual.getAttribute('data-size')).toBe('icon');
    expect(actual.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens on pointer press and names the menu by the trigger', async () => {
    render(<Menu triggerLabel="Akcje serii" items={buildItems().items} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Akcje serii' }), { button: 0, ctrlKey: false });

    const actual = await screen.findByRole('menu', { name: 'Akcje serii' });

    expect(actual.getAttribute('data-slot')).toBe('menu-content');
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Zakończ od miesiąca',
      'Zmień kwotę od miesiąca',
      'Usuń całkowicie',
    ]);
  });

  it.each(['Enter', ' ', 'ArrowDown'])('opens with the %j key', async (key) => {
    render(<Menu triggerLabel="Akcje serii" items={buildItems().items} />);

    openWithKeyboard(key);

    expect(await screen.findByRole('menu')).toBeTruthy();
  });

  it('calls only the handler of the selected item and closes', async () => {
    const { items, onEnd, onChange, onDelete } = buildItems();
    render(<Menu triggerLabel="Akcje serii" items={items} />);
    openWithKeyboard();

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Zmień kwotę od miesiąca' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onEnd).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('runs the chosen action only after the menu has closed and focus is back on the trigger', async () => {
    const focusedWhenRun: Array<Element | null> = [];
    const items: MenuItem[] = [
      { id: 'end', label: 'Zakończ od miesiąca', onSelect: () => focusedWhenRun.push(document.activeElement) },
    ];
    render(<Menu triggerLabel="Akcje serii" items={items} />);
    const trigger = openWithKeyboard();

    fireEvent.click(await screen.findByRole('menuitem'));

    await waitFor(() => expect(focusedWhenRun).toHaveLength(1));
    expect(focusedWhenRun[0]).toBe(trigger);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('puts one separator before the first destructive item only', async () => {
    render(<Menu triggerLabel="Akcje serii" items={buildItems().items} />);
    openWithKeyboard();

    const actual = (await screen.findAllByRole('separator')).map((separator) => separator.nextElementSibling?.textContent);

    expect(actual).toEqual(['Usuń całkowicie']);
  });

  it('has no separator when no destructive item follows a normal one', async () => {
    const items: MenuItem[] = [
      { id: 'delete', label: 'Usuń całkowicie', onSelect: vi.fn(), destructive: true },
      { id: 'delete-all', label: 'Usuń wszystko', onSelect: vi.fn(), destructive: true },
      { id: 'end', label: 'Zakończ od miesiąca', onSelect: vi.fn() },
    ];
    render(<Menu triggerLabel="Akcje serii" items={items} />);
    openWithKeyboard();

    await screen.findByRole('menu');

    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('marks a destructive item for styling and leaves normal items unmarked', async () => {
    render(<Menu triggerLabel="Akcje serii" items={buildItems().items} />);
    openWithKeyboard();

    expect((await screen.findByRole('menuitem', { name: 'Usuń całkowicie' })).getAttribute('data-destructive')).toBe('true');
    expect(screen.getByRole('menuitem', { name: 'Zakończ od miesiąca' }).hasAttribute('data-destructive')).toBe(false);
  });

  it('shows a disabled item with its reason as visible text that is part of its accessible name', async () => {
    const onDelete = vi.fn();
    const items: MenuItem[] = [
      { id: 'end', label: 'Zakończ od miesiąca', onSelect: vi.fn() },
      { id: 'delete', label: 'Usuń całkowicie', disabled: true, disabledReason: DISABLED_REASON, destructive: true },
    ];
    render(<Menu triggerLabel="Akcje serii" items={items} />);
    openWithKeyboard();

    const actual = await screen.findByRole('menuitem', { name: /^Usuń całkowicie/ });

    expect(actual.getAttribute('aria-disabled')).toBe('true');
    expect(actual.hasAttribute('data-disabled')).toBe(true);
    expect(screen.getByText(DISABLED_REASON).getAttribute('data-slot')).toBe('menu-item-reason');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('does not activate a disabled item and keeps the menu open', async () => {
    const items: MenuItem[] = [
      { id: 'delete', label: 'Usuń całkowicie', disabled: true, disabledReason: DISABLED_REASON },
    ];
    render(<Menu triggerLabel="Akcje serii" items={items} />);
    openWithKeyboard();

    fireEvent.click(await screen.findByRole('menuitem'));

    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('leaves enabled items without disabled attributes or a reason', async () => {
    render(<Menu triggerLabel="Akcje serii" items={buildItems().items} />);
    openWithKeyboard();

    const actual = await screen.findByRole('menuitem', { name: 'Zakończ od miesiąca' });

    expect(actual.hasAttribute('aria-disabled')).toBe(false);
    expect(actual.querySelector('[data-slot="menu-item-reason"]')).toBeNull();
  });

  it('closes on Escape without calling any handler', async () => {
    const { items, onEnd } = buildItems();
    render(<Menu triggerLabel="Akcje serii" items={items} />);
    openWithKeyboard();

    fireEvent.keyDown(await screen.findByRole('menu'), { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(onEnd).not.toHaveBeenCalled();
  });

  it.each([
    { align: undefined, expected: 'end' },
    { align: 'start' as const, expected: 'start' },
  ])('aligns the content to $expected of the trigger when align is $align', async ({ align, expected }) => {
    render(<Menu triggerLabel="Akcje serii" items={buildItems().items} align={align} />);
    openWithKeyboard();

    const actual = await screen.findByRole('menu');

    expect(actual.getAttribute('data-align')).toBe(expected);
  });
});
