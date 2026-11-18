import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from './button';
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';

const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const NARROW_WIDTH_PX = 320;
const SIDE_MARGIN_PX = 16;
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 520 } };
const DELETE_TITLE = 'Usunąć wpis „Czynsz (przykład)”?';

function resolveToken(token: string, property: 'color' | 'backgroundColor' = 'color'): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

type ExampleArgs = Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>;

interface ExampleProps {
  readonly args: ExampleArgs;
  readonly triggerLabel: string;
  readonly defaultOpen?: boolean;
  readonly closeAfterConfirm?: boolean;
}

function Example({ args, triggerLabel, defaultOpen = false, closeAfterConfirm = true }: ExampleProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleConfirm = () => {
    args.onConfirm();
    if (closeAfterConfirm) {
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <ConfirmDialog {...args} open={open} onOpenChange={setOpen} onConfirm={handleConfirm} />
    </>
  );
}

const meta = {
  title: 'Elementy bazowe/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { layout: 'padded', docs: DOCS_IFRAME },
  args: {
    title: DELETE_TITLE,
    description: 'Wpis zniknie z listy, a wynik miesiąca zostanie przeliczony. Tej operacji nie można cofnąć.',
    confirmLabel: 'Usuń wpis',
    cancelLabel: 'Anuluj',
    onConfirm: fn(),
    open: false,
    onOpenChange: fn(),
  },
  argTypes: {
    open: { control: false },
    onOpenChange: { control: false },
    confirming: { control: 'boolean' },
    children: { control: false },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" />,
};

export const DeleteOneOffEntry: Story = {
  name: 'Usuń wpis jednorazowy (E02-S03)',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" defaultOpen />,
};

const SERIES_CONSEQUENCES = [
  'Wpis „Czynsz (przykład)” przestanie się powtarzać od lutego 2027.',
  'Miesiące do stycznia 2027 zostają bez zmian.',
  'Oznaczenia „zapłacone” od lutego 2027 zostaną usunięte.',
];

function Consequences() {
  return (
    <ul className="list-disc pl-(--space-6) text-sm">
      {SERIES_CONSEQUENCES.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export const EndSeriesFromMonth: Story = {
  name: 'Zakończ serię od miesiąca (E02-S03)',
  args: {
    title: 'Zakończyć serię od lutego 2027?',
    description: 'Seria przestanie obowiązywać od wybranego miesiąca. Tej operacji nie można cofnąć.',
    confirmLabel: 'Zakończ serię',
    children: <Consequences />,
  },
  render: (args) => <Example args={args} triggerLabel="Zakończ od miesiąca" defaultOpen />,
};

export const DeleteWholeSeries: Story = {
  name: 'Usuń serię całkowicie (tylko bez miesięcy z przeszłości, E02-Q15)',
  args: {
    title: 'Usunąć całkowicie serię „Czynsz (przykład)”?',
    description: 'Seria zacznie się dopiero w przyszłości, więc żaden dotychczasowy wynik się nie zmieni. Tej operacji nie można cofnąć.',
    confirmLabel: 'Usuń serię',
  },
  render: (args) => <Example args={args} triggerLabel="Usuń całkowicie" defaultOpen />,
};

export const Confirming: Story = {
  name: 'Stan: usuwanie w toku (przycisk zajęty)',
  args: { confirming: true, confirmLabel: 'Usuwanie…' },
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" defaultOpen closeAfterConfirm={false} />,
};

export const LongContentNarrowScreen: Story = {
  name: 'Długa treść, wąski ekran (320 px)',
  globals: NARROW_VIEWPORT,
  args: {
    title: 'Usunąć wpis „Czynsz za mieszkanie wspólne z Anną i Piotrem za miesiące letnie”?',
    description:
      'Wpis zniknie z listy konta wspólnego: https://example.com/bardzo/dlugi/adres/bez/spacji/w/opisie. Tej operacji nie można cofnąć.',
    confirmLabel: 'Usuń wpis konta wspólnego',
  },
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" defaultOpen />,
};

function DisabledReason({ children }: { readonly children: ReactNode }) {
  return (
    <p id="delete-series-reason" className="max-w-prose text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export const TriggerDisabledWithReason: Story = {
  name: 'Wyzwalacz zablokowany z powodem (seria z miesiącami z przeszłości, E02-Q15)',
  parameters: { docs: { story: { inline: true } } },
  render: () => (
    <div className="flex flex-col gap-(--space-within-group)">
      <Button variant="secondary" aria-disabled="true" aria-describedby="delete-series-reason">
        Usuń całkowicie
      </Button>
      <DisabledReason>Seria ma miesiące z przeszłości, więc nie można jej usunąć. Możesz ją tylko zakończyć od wybranego miesiąca.</DisabledReason>
    </div>
  ),
};

export const States: Story = {
  name: 'Stany przycisków: domyślny, najechanie i fokus (podgląd), ładowanie',
  parameters: { docs: { story: { inline: true } } },
  render: () => (
    <div className="flex flex-col gap-(--space-within-group)">
      <div className="flex flex-wrap items-center gap-(--space-within-group)">
        <Button variant="secondary">Anuluj</Button>
        <Button variant="secondary" data-preview-state="hover">Anuluj (najechanie)</Button>
        <Button variant="secondary" data-preview-state="focus-visible">Anuluj (fokus)</Button>
      </div>
      <div className="flex flex-wrap items-center gap-(--space-within-group)">
        <Button variant="destructive">Usuń wpis</Button>
        <Button variant="destructive" data-preview-state="hover">Usuń wpis (najechanie)</Button>
        <Button variant="destructive" data-preview-state="focus-visible">Usuń wpis (fokus)</Button>
        <Button variant="destructive" loading>Usuwanie…</Button>
      </div>
    </div>
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
        <GoodBad verdict="Dobrze" explanation="Przyciski nazywają czynności czasownikiem i obiektem, a rezygnacja jest łatwa do znalezienia.">
          <Button variant="secondary">Anuluj</Button>
          <Button variant="destructive">Usuń wpis</Button>
        </GoodBad>
        <GoodBad verdict="Źle" explanation="„OK” i „Tak” nie mówią, co się stanie; przy nieodwracalnej akcji to prosta droga do pomyłki.">
          <Button variant="secondary">Nie</Button>
          <Button variant="destructive">OK</Button>
        </GoodBad>
      </div>
      <div className="flex flex-wrap gap-4">
        <GoodBad verdict="Dobrze" explanation="Tytuł zawiera nazwę obiektu, a opis mówi, co się stanie i że nie można tego cofnąć.">
          <p className="font-semibold">Usunąć wpis „Czynsz (przykład)”?</p>
        </GoodBad>
        <GoodBad verdict="Źle" explanation="Nie wiadomo, co zostanie usunięte ani czy da się to cofnąć.">
          <p className="font-semibold">Czy na pewno?</p>
        </GoodBad>
      </div>
    </div>
  ),
};

async function openFrom(canvasElement: HTMLElement, triggerLabel: string, title: string) {
  const trigger = within(canvasElement).getByRole('button', { name: triggerLabel });
  await userEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: title });
  return { trigger, dialog };
}

export const FocusStartsOnCancel: Story = {
  name: 'Test: otwarcie przenosi fokus na "Anuluj", nie na przycisk usuwający',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" />,
  play: async ({ canvasElement }) => {
    await openFrom(canvasElement, 'Usuń wpis', DELETE_TITLE);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Anuluj' })).toHaveFocus());
    await expect(screen.getByRole('button', { name: 'Usuń wpis' })).not.toHaveFocus();
  },
};

export const NamesAndDescribesWhatWillHappen: Story = {
  name: 'Test: okno ma nazwę z tytułu i opis skutków, przyciski nazwane czasownikiem',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" />,
  play: async ({ canvasElement }) => {
    const { dialog } = await openFrom(canvasElement, 'Usuń wpis', DELETE_TITLE);
    const dialogQueries = within(dialog);

    await expect(dialog).toHaveAccessibleDescription(
      'Wpis zniknie z listy, a wynik miesiąca zostanie przeliczony. Tej operacji nie można cofnąć.',
    );
    await expect(dialogQueries.getByRole('button', { name: 'Anuluj' })).toBeVisible();
    await expect(dialogQueries.getByRole('button', { name: 'Usuń wpis' })).toBeVisible();
    await expect(dialogQueries.queryByRole('button', { name: 'OK' })).toBeNull();
  },
};

export const TabCyclesInsideAndEscapeReturnsFocus: Story = {
  name: 'Test: Tab krąży po dwóch przyciskach, Escape zamyka, fokus wraca na wyzwalacz',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" />,
  play: async ({ canvasElement }) => {
    const { trigger, dialog } = await openFrom(canvasElement, 'Usuń wpis', DELETE_TITLE);
    const cancel = screen.getByRole('button', { name: 'Anuluj' });
    const confirm = within(dialog).getByRole('button', { name: 'Usuń wpis' });

    await waitFor(() => expect(cancel).toHaveFocus());
    await userEvent.tab();
    await expect(confirm).toHaveFocus();
    await userEvent.tab();
    await expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(confirm).toHaveFocus();
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const OverlayClickDoesNotClose: Story = {
  name: 'Test: kliknięcie przesłony NIE zamyka okna potwierdzenia',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" />,
  play: async ({ canvasElement }) => {
    await openFrom(canvasElement, 'Usuń wpis', DELETE_TITLE);
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;

    await userEvent.click(overlay);
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect(screen.getByRole('dialog')).toBeVisible();
  },
};

export const CancelClosesWithoutConfirming: Story = {
  name: 'Test: "Anuluj" (Enter na fokusie domyślnym) zamyka okno bez wywołania akcji',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" />,
  play: async ({ canvasElement, args }) => {
    const { trigger } = await openFrom(canvasElement, 'Usuń wpis', DELETE_TITLE);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Anuluj' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const ConfirmCallsHandler: Story = {
  name: 'Test: "Usuń wpis" wywołuje akcję raz',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" />,
  play: async ({ canvasElement, args }) => {
    const { dialog } = await openFrom(canvasElement, 'Usuń wpis', DELETE_TITLE);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Usuń wpis' }));

    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const ConfirmingIsBusyAndIgnoresClicks: Story = {
  ...Confirming,
  name: 'Test: w trakcie usuwania przycisk ma aria-busy, ignoruje kliknięcia, a okno zostaje otwarte',
  play: async ({ args }) => {
    const confirm = await screen.findByRole('button', { name: 'Usuwanie…' });

    await userEvent.click(confirm);

    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    await expect(confirm).toHaveAttribute('aria-disabled', 'true');
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await expect(screen.getByRole('dialog')).toBeVisible();
  },
};

export const UsesDestructiveAndSecondaryTokens: Story = {
  name: 'Test: przycisk usuwający ma --destructive z tekstem --destructive-foreground, "Anuluj" ma --muted, obie 36 px',
  render: (args) => <Example args={args} triggerLabel="Usuń wpis" defaultOpen />,
  play: async () => {
    const dialog = await screen.findByRole('dialog');
    const confirm = getComputedStyle(within(dialog).getByRole('button', { name: 'Usuń wpis' }));
    const cancel = getComputedStyle(within(dialog).getByRole('button', { name: 'Anuluj' }));
    const description = getComputedStyle(within(dialog).getByText(/Wpis zniknie z listy/));

    await expect(confirm.backgroundColor).toBe(resolveToken('--destructive', 'backgroundColor'));
    await expect(confirm.color).toBe(resolveToken('--destructive-foreground'));
    await expect(cancel.backgroundColor).toBe(resolveToken('--muted', 'backgroundColor'));
    await expect(confirm.height).toBe('36px');
    await expect(cancel.height).toBe('36px');
    await expect(description.fontSize).toBe('16px');
    await expect(description.color).toBe(resolveToken('--foreground'));
    await expect(within(dialog).queryByRole('button', { name: /Zamknij/ })).toBeNull();
  },
};

export const FitsNarrowScreen: Story = {
  ...LongContentNarrowScreen,
  name: 'Test: przy 320 px okno ma margines 16 px, długi tekst zawija się bez przewijania poziomego',
  play: async () => {
    const dialog = await screen.findByRole('dialog');
    const body = dialog.querySelector('[data-slot="dialog-body"]') as HTMLElement;
    const box = dialog.getBoundingClientRect();

    await expect(window.innerWidth).toBe(NARROW_WIDTH_PX);
    await expect(box.left).toBe(SIDE_MARGIN_PX);
    await expect(box.right).toBe(NARROW_WIDTH_PX - SIDE_MARGIN_PX);
    await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight - SIDE_MARGIN_PX);
  },
};
