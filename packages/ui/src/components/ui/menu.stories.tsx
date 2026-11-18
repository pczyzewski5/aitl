import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useEffect, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { ConfirmDialog } from './confirm-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Field } from './field';
import { Input } from './input';
import { Button } from './button';
import { Menu, type MenuItem } from './menu';

const TRIGGER_LABEL = 'Akcje serii „Czynsz (przykład)”';
const CONTROL_HEIGHT_PX = 36;
const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const NARROW_WIDTH_PX = 320;
const EDGE_MARGIN_PX = 16;
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 360 } };
const END_LABEL = 'Zakończ od miesiąca';
const CHANGE_LABEL = 'Zmień kwotę od miesiąca';
const DELETE_LABEL = 'Usuń całkowicie';
const DELETE_DISABLED_REASON = 'Seria ma miesiące w przeszłości, użyj „Zakończ od miesiąca”.';

function resolveToken(token: string, property: 'color' | 'backgroundColor' = 'color'): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

type SeriesDialog = 'end' | 'change' | 'delete' | null;

const onConfirmed = fn();

interface SeriesActionsProps {
  readonly hasPastMonths?: boolean;
  readonly defaultOpen?: boolean;
}

function SeriesActions({ hasPastMonths = false, defaultOpen = false }: SeriesActionsProps) {
  const [dialog, setDialog] = useState<SeriesDialog>(null);
  const close = () => setDialog(null);
  const confirm = (action: string) => {
    onConfirmed(action);
    close();
  };

  const deleteItem: MenuItem = hasPastMonths
    ? { id: 'delete', label: DELETE_LABEL, destructive: true, disabled: true, disabledReason: DELETE_DISABLED_REASON }
    : { id: 'delete', label: DELETE_LABEL, destructive: true, onSelect: () => setDialog('delete') };

  const items: MenuItem[] = [
    { id: 'end', label: END_LABEL, onSelect: () => setDialog('end') },
    { id: 'change', label: CHANGE_LABEL, onSelect: () => setDialog('change') },
    deleteItem,
  ];

  return (
    <>
      <Menu triggerLabel={TRIGGER_LABEL} items={items} defaultOpen={defaultOpen} />
      <ConfirmDialog
        open={dialog === 'end'}
        onOpenChange={close}
        title="Zakończyć serię od lutego 2027?"
        description="Seria przestanie obowiązywać od wybranego miesiąca. Tej operacji nie można cofnąć."
        confirmLabel="Zakończ serię"
        cancelLabel="Anuluj"
        onConfirm={() => confirm('end')}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={close}
        title="Usunąć całkowicie serię „Czynsz (przykład)”?"
        description="Seria zacznie się dopiero w przyszłości, więc żaden dotychczasowy wynik się nie zmieni. Tej operacji nie można cofnąć."
        confirmLabel="Usuń serię"
        cancelLabel="Anuluj"
        onConfirm={() => confirm('delete')}
      />
      <Dialog open={dialog === 'change'} onOpenChange={close}>
        <DialogContent closeLabel="Zamknij okno">
          <DialogHeader>
            <DialogTitle>Zmień kwotę od miesiąca</DialogTitle>
            <DialogDescription>Nowa kwota obowiązuje od wybranego miesiąca. Wcześniejsze miesiące zostają bez zmian.</DialogDescription>
          </DialogHeader>
          <Field label="Nowa kwota">
            <Input type="amount" defaultValue="1 850,00" />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Anuluj</Button>
            </DialogClose>
            <Button onClick={() => confirm('change')}>Zapisz kwotę</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const onEnd = fn();
const onChange = fn();
const onDelete = fn();

const meta = {
  title: 'Elementy bazowe/Menu',
  component: Menu,
  parameters: { layout: 'padded', docs: DOCS_IFRAME },
  args: {
    triggerLabel: TRIGGER_LABEL,
    align: 'end',
    items: [
      { id: 'end', label: END_LABEL, onSelect: onEnd },
      { id: 'change', label: CHANGE_LABEL, onSelect: onChange },
      { id: 'delete', label: DELETE_LABEL, onSelect: onDelete, destructive: true },
    ],
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    align: { control: 'inline-radio', options: ['start', 'end'] },
    items: { control: false },
    defaultOpen: { control: false },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

function Aligned({ children }: { readonly children: ReactNode }) {
  return <div className="flex justify-end">{children}</div>;
}

export const Playground: Story = {
  render: (args) => (
    <Aligned>
      <Menu {...args} />
    </Aligned>
  ),
};

export const Closed: Story = {
  name: 'Zamknięte: sam przycisk z trzema kropkami',
  parameters: { docs: { story: { inline: true } } },
  render: (args) => (
    <Aligned>
      <Menu {...args} />
    </Aligned>
  ),
};

export const Open: Story = {
  name: 'Otwarte: zwykłe pozycje i pozycja destrukcyjna za separatorem',
  render: (args) => (
    <Aligned>
      <Menu {...args} defaultOpen />
    </Aligned>
  ),
};

export const DisabledItemWithReason: Story = {
  name: 'Pozycja zablokowana z powodem (seria z miesiącami w przeszłości, E02-Q15)',
  render: () => (
    <Aligned>
      <SeriesActions hasPastMonths defaultOpen />
    </Aligned>
  ),
};

const PREVIEW_STATE_ATTRIBUTE = 'data-preview-state';

function useFreezeItemStates(states: Readonly<Record<string, 'hover' | 'focus-visible'>>) {
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll<HTMLElement>('[data-slot="menu-item"]').forEach((item) => {
        const state = states[item.textContent ?? ''];
        if (state) {
          item.setAttribute(PREVIEW_STATE_ATTRIBUTE, state);
        }
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [states]);
}

const FROZEN_STATES = { [CHANGE_LABEL]: 'hover', [DELETE_LABEL]: 'focus-visible' } as const;

function FrozenStates() {
  useFreezeItemStates(FROZEN_STATES);
  return (
    <Aligned>
      <SeriesActions defaultOpen />
    </Aligned>
  );
}

export const ItemStates: Story = {
  name: 'Stany pozycji: najechanie (podgląd) i fokus klawiatury (podgląd)',
  render: () => <FrozenStates />,
};

export const SeriesActionsComposition: Story = {
  name: 'Akcje serii (E02-S03): okna z pozycji menu',
  render: () => (
    <Aligned>
      <SeriesActions />
    </Aligned>
  ),
};

const LONG_ITEMS: MenuItem[] = [
  { id: 'end', label: 'Zakończ od miesiąca serię „Czynsz za mieszkanie wspólne z Anną i Piotrem za miesiące letnie”', onSelect: fn() },
  { id: 'url', label: 'Pokaż rozliczenie https://example.com/bardzo/dlugi/adres/bez/spacji/w/etykiecie', onSelect: fn() },
  {
    id: 'delete',
    label: DELETE_LABEL,
    destructive: true,
    disabled: true,
    disabledReason: 'Seria ma miesiące w przeszłości, więc nie można jej usunąć. Możesz ją tylko zakończyć od wybranego miesiąca.',
  },
];

export const LongLabelsNarrowScreen: Story = {
  name: 'Długie etykiety, wąski ekran (320 px)',
  globals: NARROW_VIEWPORT,
  render: (args) => (
    <Aligned>
      <Menu {...args} items={LONG_ITEMS} defaultOpen />
    </Aligned>
  ),
};

interface EntryRow {
  readonly id: string;
  readonly name: string;
  readonly amount: string;
}

const ENTRY_ROWS: EntryRow[] = [
  { id: 'rent', name: 'Czynsz (przykład)', amount: '1 850,00 zł' },
  { id: 'internet', name: 'Internet (przykład)', amount: '59,00 zł' },
  { id: 'insurance', name: 'Ubezpieczenie mieszkania (przykład)', amount: '38,50 zł' },
];

export const InTableRow: Story = {
  name: 'Menu w wierszu tabeli wpisów (E02-S03)',
  parameters: { docs: { story: { inline: false, iframeHeight: 420 } } },
  render: () => (
    <table className="w-full text-left text-sm">
      <caption className="pb-(--space-within-group) text-left font-semibold">Wpisy cykliczne, listopad 2026 (przykład)</caption>
      <thead>
        <tr>
          <th scope="col" className="py-(--space-1) font-semibold">Nazwa</th>
          <th scope="col" className="py-(--space-1) text-right font-semibold">Kwota</th>
          <th scope="col" className="w-control py-(--space-1)">
            <span className="sr-only">Akcje</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {ENTRY_ROWS.map((row) => (
          <tr key={row.id} className="border-t border-border">
            <th scope="row" className="py-(--space-1) font-normal">{row.name}</th>
            <td className="py-(--space-1) text-right">{row.amount}</td>
            <td className="py-(--space-1)">
              <Menu
                triggerLabel={`Akcje wpisu ${row.name}`}
                items={[
                  { id: 'change', label: CHANGE_LABEL, onSelect: fn() },
                  { id: 'delete', label: 'Usuń wpis', onSelect: fn(), destructive: true },
                ]}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

interface GoodBadProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function GoodBad({ verdict, explanation, children }: GoodBadProps) {
  return (
    <figure className="flex flex-1 flex-col gap-2 rounded-card border border-border bg-background p-4">
      <p className="font-semibold">{verdict}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  parameters: { docs: { story: { inline: true } } },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <GoodBad verdict="Dobrze" explanation="Przycisk ma nazwę dostępną i opisuje, czego dotyczą akcje (której serii).">
          <Menu triggerLabel={TRIGGER_LABEL} items={[{ id: 'end', label: END_LABEL, onSelect: fn() }]} />
        </GoodBad>
        <GoodBad verdict="Źle" explanation="Same trzy kropki bez nazwy: czytnik ekranu ogłosi „przycisk”, a użytkownik nie wie, czego dotyczy menu.">
          <Button variant="ghost" size="icon" aria-hidden="true" tabIndex={-1}>⋯</Button>
        </GoodBad>
      </div>
      <div className="flex flex-wrap gap-4">
        <GoodBad verdict="Dobrze" explanation="Niedostępna akcja jest widoczna z powodem w tekście i podpowiedzią, co zrobić zamiast.">
          <div className="flex flex-col text-sm">
            <span>{DELETE_LABEL}</span>
            <span className="text-muted-foreground">{DELETE_DISABLED_REASON}</span>
          </div>
        </GoodBad>
        <GoodBad verdict="Źle" explanation="Przygaszona pozycja bez powodu: użytkownik nie wie, czy to błąd, brak uprawnień czy stan danych.">
          <span className="text-sm text-muted-foreground">{DELETE_LABEL}</span>
        </GoodBad>
      </div>
    </div>
  ),
};

async function openByClick(canvasElement: HTMLElement) {
  const trigger = within(canvasElement).getByRole('button', { name: TRIGGER_LABEL });
  await userEvent.click(trigger);
  const menu = await screen.findByRole('menu', { name: TRIGGER_LABEL });
  return { trigger, menu };
}

export const OpensByClick: Story = {
  name: 'Test: otwiera się kliknięciem, ma rolę menu z nazwą z przycisku i pozycje menuitem',
  render: Closed.render,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER_LABEL });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const { menu } = await openByClick(canvasElement);

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    await expect(
      within(menu).getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual([END_LABEL, CHANGE_LABEL, DELETE_LABEL]);
    await expect(within(menu).getByRole('separator')).toBeVisible();
  },
};

export const OpensByKeyboard: Story = {
  name: 'Test: otwiera się klawiszami Enter, spacja i strzałka w dół, fokus trafia na pierwszą pozycję',
  render: Closed.render,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER_LABEL });

    for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
      trigger.focus();
      await userEvent.keyboard(key);
      const first = await screen.findByRole('menuitem', { name: END_LABEL });
      await waitFor(() => expect(first).toHaveFocus());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  },
};

export const ArrowKeysHomeEndAndTypeahead: Story = {
  name: 'Test: strzałki (bez zawijania), Home, End i wpisanie litery przenoszą fokus między pozycjami, Tab nie wychodzi z menu',
  render: Closed.render,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER_LABEL });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const end = await screen.findByRole('menuitem', { name: END_LABEL });
    const change = screen.getByRole('menuitem', { name: CHANGE_LABEL });
    const remove = screen.getByRole('menuitem', { name: DELETE_LABEL });
    await waitFor(() => expect(end).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    await expect(change).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(remove).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(remove).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(change).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(end).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(remove).toHaveFocus();
    await userEvent.keyboard('z');
    await expect(end).toHaveFocus();
    await userEvent.keyboard('{Tab}');
    await expect(screen.getByRole('menu')).toBeVisible();
    await expect(end).toHaveFocus();
  },
};

export const EscapeClosesAndReturnsFocus: Story = {
  name: 'Test: Escape zamyka menu bez wywołania akcji, a fokus wraca na przycisk',
  render: Closed.render,
  play: async ({ canvasElement }) => {
    const { trigger } = await openByClick(canvasElement);

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(onEnd).not.toHaveBeenCalled();
    await expect(onChange).not.toHaveBeenCalled();
    await expect(onDelete).not.toHaveBeenCalled();
  },
};

export const SelectionCallsHandlerOnce: Story = {
  name: 'Test: wybór pozycji (mysz i klawiatura) wywołuje jej akcję raz i zamyka menu',
  render: Closed.render,
  play: async ({ canvasElement }) => {
    const { trigger } = await openByClick(canvasElement);

    await userEvent.click(screen.getByRole('menuitem', { name: CHANGE_LABEL }));

    await expect(onChange).toHaveBeenCalledTimes(1);
    await expect(onEnd).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await screen.findByRole('menu');
    await userEvent.keyboard('{Enter}');

    await expect(onEnd).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  },
};

export const DisabledItemExposesReasonAndCannotBeActivated: Story = {
  name: 'Test: pozycja zablokowana ma powód w tekście i w nazwie dostępnej, nie daje się aktywować, ale da się ją odczytać',
  render: () => (
    <Aligned>
      <SeriesActions hasPastMonths />
    </Aligned>
  ),
  play: async ({ canvasElement }) => {
    const { trigger } = await openByClick(canvasElement);
    const disabled = screen.getByRole('menuitem', { name: `${DELETE_LABEL} ${DELETE_DISABLED_REASON}` });

    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(within(disabled).getByText(DELETE_DISABLED_REASON)).toBeVisible();

    await userEvent.keyboard('{End}');
    await expect(disabled).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(disabled);

    await expect(screen.getByRole('menu')).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const UsesTokensAndTouchTargets: Story = {
  name: 'Test: kolory z tokenów (--card, --border, --destructive, --muted), pozycje i przycisk co najmniej 36 px',
  render: Open.render,
  play: async ({ canvasElement }) => {
    const menu = await screen.findByRole('menu');
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER_LABEL });
    const normal = screen.getByRole('menuitem', { name: END_LABEL });
    const destructive = screen.getByRole('menuitem', { name: DELETE_LABEL });
    const menuStyle = getComputedStyle(menu);

    await expect(menuStyle.backgroundColor).toBe(resolveToken('--card', 'backgroundColor'));
    await expect(menuStyle.borderTopColor).toBe(resolveToken('--border'));
    await expect(menuStyle.boxShadow).toBe('none');
    await expect(getComputedStyle(destructive).color).toBe(resolveToken('--destructive'));
    await expect(getComputedStyle(normal).color).toBe(resolveToken('--card-foreground'));
    await expect(normal.getBoundingClientRect().height).toBeGreaterThanOrEqual(CONTROL_HEIGHT_PX);
    await expect(destructive.getBoundingClientRect().height).toBeGreaterThanOrEqual(CONTROL_HEIGHT_PX);
    await expect(trigger.getBoundingClientRect().height).toBe(CONTROL_HEIGHT_PX);
    await expect(trigger.getBoundingClientRect().width).toBe(CONTROL_HEIGHT_PX);
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(getComputedStyle(normal).backgroundColor).toBe(resolveToken('--muted', 'backgroundColor')));
  },
};

export const FitsNarrowScreen: Story = {
  ...LongLabelsNarrowScreen,
  name: 'Test: przy 320 px menu mieści się w ekranie z marginesem, długi tekst zawija się',
  play: async () => {
    const menu = await screen.findByRole('menu');
    const box = menu.getBoundingClientRect();

    await expect(window.innerWidth).toBe(NARROW_WIDTH_PX);
    await expect(box.left).toBeGreaterThanOrEqual(EDGE_MARGIN_PX);
    await expect(box.right).toBeLessThanOrEqual(NARROW_WIDTH_PX - EDGE_MARGIN_PX);
    await expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
  },
};

export const OpensConfirmDialogAndReturnsFocusToTrigger: Story = {
  name: 'Test: pozycja otwiera okno potwierdzenia, a po jego zamknięciu fokus wraca na przycisk menu',
  render: () => (
    <Aligned>
      <SeriesActions />
    </Aligned>
  ),
  play: async ({ canvasElement }) => {
    const { trigger } = await openByClick(canvasElement);

    await userEvent.click(screen.getByRole('menuitem', { name: END_LABEL }));
    const dialog = await screen.findByRole('dialog', { name: 'Zakończyć serię od lutego 2027?' });
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Anuluj' })).toHaveFocus());
    await expect(screen.queryByRole('menu')).toBeNull();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const OpensDialogAndReturnsFocusToTrigger: Story = {
  name: 'Test: pozycja otwiera Dialog z formularzem, a po zamknięciu fokus wraca na przycisk menu',
  render: OpensConfirmDialogAndReturnsFocusToTrigger.render,
  play: async ({ canvasElement }) => {
    const { trigger } = await openByClick(canvasElement);

    await userEvent.click(screen.getByRole('menuitem', { name: CHANGE_LABEL }));
    const dialog = await screen.findByRole('dialog', { name: CHANGE_LABEL });
    await waitFor(() => expect(within(dialog).getByRole('textbox', { name: 'Nowa kwota' })).toHaveFocus());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zamknij okno' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ConfirmingFromMenuCallsActionOnce: Story = {
  name: 'Test: "Usuń całkowicie" z menu serii bez miesięcy z przeszłości prowadzi do potwierdzenia i wywołuje akcję raz',
  render: () => (
    <Aligned>
      <SeriesActions />
    </Aligned>
  ),
  play: async ({ canvasElement }) => {
    await openByClick(canvasElement);

    await userEvent.click(screen.getByRole('menuitem', { name: DELETE_LABEL }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Usuń serię' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(onConfirmed).toHaveBeenCalledTimes(1);
    await expect(onConfirmed).toHaveBeenCalledWith('delete');
  },
};
