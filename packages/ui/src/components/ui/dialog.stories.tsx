import type { Meta, StoryObj } from '@storybook/react-vite';
import X from 'lucide-react/icons/x';
import type { ReactNode } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from './button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Field } from './field';
import { Input } from './input';

const CLOSE_LABEL = 'Zamknij okno';
const CONTROL_HEIGHT_PX = 36;
const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const NARROW_WIDTH_PX = 320;
const SIDE_MARGIN_PX = 16;
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 520 } };

function resolveToken(token: string, property: 'color' | 'backgroundColor' = 'color'): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

interface AmountDialogProps {
  readonly closeLabel?: string;
  readonly dismissOnOverlayClick?: boolean;
  readonly defaultOpen?: boolean;
  readonly withDescription?: boolean;
  readonly onSave?: () => void;
}

function AmountDialog({
  closeLabel,
  dismissOnOverlayClick,
  defaultOpen = false,
  withDescription = true,
  onSave,
}: AmountDialogProps) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Zmień kwotę od miesiąca</Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={closeLabel}
        dismissOnOverlayClick={dismissOnOverlayClick}
        {...(withDescription ? {} : { 'aria-describedby': undefined })}
      >
        <DialogHeader>
          <DialogTitle>Zmień kwotę od miesiąca</DialogTitle>
          {withDescription ? (
            <DialogDescription>Nowa kwota obowiązuje od wybranego miesiąca. Wcześniejsze miesiące zostają bez zmian.</DialogDescription>
          ) : null}
        </DialogHeader>
        <Field label="Nowa kwota">
          <Input type="amount" defaultValue="1 850,00" />
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Anuluj</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={onSave}>Zapisz kwotę</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  title: 'Elementy bazowe/Dialog',
  component: DialogContent,
  parameters: { layout: 'padded', docs: DOCS_IFRAME },
  args: { closeLabel: CLOSE_LABEL, dismissOnOverlayClick: true },
  argTypes: {
    closeLabel: { control: 'text' },
    dismissOnOverlayClick: { control: 'boolean' },
    children: { control: false },
  },
} satisfies Meta<typeof DialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => <AmountDialog closeLabel={args.closeLabel} dismissOnOverlayClick={args.dismissOnOverlayClick} />,
};

export const Open: Story = {
  name: 'Otwarty: zmiana kwoty serii (E02-S03)',
  render: (args) => <AmountDialog defaultOpen closeLabel={args.closeLabel} />,
};

export const WithoutDescription: Story = {
  name: 'Bez opisu (tylko tytuł i pole)',
  render: (args) => <AmountDialog defaultOpen withDescription={false} closeLabel={args.closeLabel} />,
};

export const WithoutCloseButton: Story = {
  name: 'Bez przycisku zamknięcia w rogu (wyjście przez "Anuluj" i Escape)',
  render: () => <AmountDialog defaultOpen />,
};

const monthFormat = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });
const LONG_LIST = Array.from({ length: 24 }, (_, index) => `${monthFormat.format(new Date(2026, 11 + index, 1))}: 1 850,00 zł`);

function LongContentDialog() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="secondary">Pokaż skutki zmiany</Button>
      </DialogTrigger>
      <DialogContent closeLabel={CLOSE_LABEL}>
        <DialogHeader>
          <DialogTitle>Skutki zmiany kwoty serii „Czynsz za mieszkanie wspólne z Anną i Piotrem”</DialogTitle>
          <DialogDescription>Kwota zmieni się w poniższych miesiącach. Adres rozliczenia: https://example.com/bardzo/dlugi/adres/bez/spacji/w/opisie.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-(--space-within-group) text-sm">
          {LONG_LIST.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Rozumiem</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const LongContentNarrowScreen: Story = {
  name: 'Długa treść, wąski ekran (320 px): przewija się wewnątrz okna',
  globals: NARROW_VIEWPORT,
  render: () => <LongContentDialog />,
};

interface ExampleProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function Example({ verdict, explanation, children }: ExampleProps) {
  return (
    <figure className="flex flex-1 flex-col gap-2 rounded-card border border-border bg-background p-4">
      <p className="font-semibold">{verdict}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const States: Story = {
  name: 'Stany: zamknięty, wyzwalacz zablokowany, przycisk zamknięcia (najechanie i fokus, podgląd)',
  parameters: { docs: { story: { inline: true } } },
  render: () => (
    <div className="flex flex-col gap-(--space-section)">
      <div className="flex flex-wrap items-center gap-(--space-within-group)">
        <AmountDialog />
      </div>
      <div className="flex flex-col gap-(--space-within-group)">
        <Button variant="secondary" aria-disabled="true" aria-describedby="series-reason">
          Zmień kwotę od miesiąca
        </Button>
        <p id="series-reason" className="max-w-prose text-sm text-muted-foreground">
          Seria jest zakończona, więc nie można zmienić jej kwoty. Wybierz aktywną serię.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-(--space-within-group)">
        <Button variant="ghost" size="icon" aria-label="Zamknij okno (domyślny)">
          <X aria-hidden="true" className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Zamknij okno (najechanie)" data-preview-state="hover">
          <X aria-hidden="true" className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Zamknij okno (fokus)" data-preview-state="focus-visible">
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  ),
};

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  parameters: { docs: { story: { inline: true } } },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Tytuł mówi, czego dotyczy okno, a przycisk głównej akcji nazywa czynność.">
          <p className="font-semibold">Zmień kwotę od miesiąca</p>
          <Button>Zapisz kwotę</Button>
        </Example>
        <Example verdict="Źle" explanation="Tytuł niczego nie mówi, a „OK” nie opisuje skutku kliknięcia.">
          <p className="font-semibold">Uwaga</p>
          <Button>OK</Button>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Okno służy do decyzji lub krótkiego formularza, który zatrzymuje użytkownika w jednym zadaniu.">
          <Button variant="secondary">Zmień kwotę od miesiąca</Button>
        </Example>
        <Example verdict="Źle" explanation="Komunikat „zapisano” nie wymaga decyzji, więc nie blokuje ekranu: to zadanie Toastu (PR N).">
          <Button variant="secondary">Pokaż potwierdzenie zapisu w oknie</Button>
        </Example>
      </div>
    </div>
  ),
};

async function openFromTrigger(canvasElement: HTMLElement) {
  const trigger = within(canvasElement).getByRole('button', { name: 'Zmień kwotę od miesiąca' });
  await userEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Zmień kwotę od miesiąca' });
  return { trigger, dialog };
}

export const OpensWithClickAndNamesItself: Story = {
  name: 'Test: otwiera się klikiem, ma nazwę z tytułu i opis, ukrywa resztę strony przed czytnikiem',
  render: (args) => <AmountDialog closeLabel={args.closeLabel} />,
  play: async ({ canvasElement }) => {
    await expect(screen.queryByRole('dialog')).toBeNull();

    const { dialog } = await openFromTrigger(canvasElement);

    await expect(dialog).toHaveAccessibleDescription('Nowa kwota obowiązuje od wybranego miesiąca. Wcześniejsze miesiące zostają bez zmian.');
    await expect(screen.getByRole('heading', { level: 2, name: 'Zmień kwotę od miesiąca' })).toBeVisible();
    await expect(canvasElement.closest('[aria-hidden="true"]')).not.toBeNull();
  },
};

export const OpensWithKeyboard: Story = {
  name: 'Test: otwiera się klawiszem Enter i spacją z wyzwalacza',
  render: (args) => <AmountDialog closeLabel={args.closeLabel} />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Zmień kwotę od miesiąca' });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(await screen.findByRole('dialog')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await userEvent.keyboard(' ');

    await expect(await screen.findByRole('dialog')).toBeVisible();
  },
};

export const TrapsFocusAndReturnsItOnEscape: Story = {
  name: 'Test: fokus zostaje w oknie, Escape zamyka, fokus wraca na wyzwalacz',
  render: (args) => <AmountDialog closeLabel={args.closeLabel} />,
  play: async ({ canvasElement }) => {
    const { trigger, dialog } = await openFromTrigger(canvasElement);

    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    const visited = new Set<Element | null>();
    for (let step = 0; step < 6; step += 1) {
      await userEvent.tab();
      visited.add(document.activeElement);
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(visited.size).toBe(4);
  },
};

export const InitialFocusIsOnTheFirstField: Story = {
  name: 'Test: po otwarciu fokus jest na pierwszym polu okna, a przycisk zamknięcia jest ostatni w kolejności',
  render: (args) => <AmountDialog closeLabel={args.closeLabel} />,
  play: async ({ canvasElement }) => {
    await openFromTrigger(canvasElement);

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Nowa kwota' })).toHaveFocus());
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(screen.getByRole('button', { name: CLOSE_LABEL })).toHaveFocus();
  },
};

export const OverlayClickClosesAndReturnsFocus: Story = {
  name: 'Test: kliknięcie przesłony zamyka okno (Dialog bez decyzji) i oddaje fokus',
  render: (args) => <AmountDialog closeLabel={args.closeLabel} />,
  play: async ({ canvasElement }) => {
    const { trigger } = await openFromTrigger(canvasElement);
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;

    await userEvent.click(overlay);

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const OverlayClickCanBeTurnedOff: Story = {
  name: 'Test: dismissOnOverlayClick=false: kliknięcie przesłony nie zamyka okna',
  render: (args) => <AmountDialog closeLabel={args.closeLabel} dismissOnOverlayClick={false} />,
  play: async ({ canvasElement }) => {
    await openFromTrigger(canvasElement);
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;

    await userEvent.click(overlay);
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect(screen.getByRole('dialog')).toBeVisible();
  },
};

export const CloseButtonHasNameAndTarget: Story = {
  name: 'Test: przycisk zamknięcia ma nazwę z propsa i cel 36 px, zamyka okno',
  render: (args) => <AmountDialog closeLabel={args.closeLabel} />,
  play: async ({ canvasElement }) => {
    const { trigger } = await openFromTrigger(canvasElement);
    const closeButton = screen.getByRole('button', { name: CLOSE_LABEL });
    const box = closeButton.getBoundingClientRect();

    await expect(box.width).toBe(CONTROL_HEIGHT_PX);
    await expect(box.height).toBe(CONTROL_HEIGHT_PX);
    await expect(closeButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(closeButton);

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const WithoutDescriptionHasNoDescribedBy: Story = {
  name: 'Test: bez opisu okno nie ma aria-describedby, ale ma nazwę',
  render: (args) => <AmountDialog defaultOpen withDescription={false} closeLabel={args.closeLabel} />,
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Zmień kwotę od miesiąca' });

    await expect(dialog).not.toHaveAttribute('aria-describedby');
  },
};

export const UsesTokensForSurfaceOverlayAndType: Story = {
  name: 'Test: przesłona --overlay, okno --card z ramką --border, bez cienia i animacji, typografia z tokenów',
  render: (args) => <AmountDialog defaultOpen closeLabel={args.closeLabel} />,
  play: async () => {
    const dialog = await screen.findByRole('dialog');
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
    const title = getComputedStyle(screen.getByRole('heading', { level: 2 }));
    const description = getComputedStyle(screen.getByText(/Nowa kwota obowiązuje/));
    const windowStyles = getComputedStyle(dialog);
    const overlayStyles = getComputedStyle(overlay);
    const overlayColour = resolveToken('--overlay', 'backgroundColor');

    await expect(overlayStyles.backgroundColor).toBe(overlayColour);
    await expect(overlayColour).toMatch(/\/ 0\.6\)$/);
    await expect(overlayStyles.position).toBe('fixed');
    await expect(windowStyles.backgroundColor).toBe(resolveToken('--card', 'backgroundColor'));
    await expect(windowStyles.borderTopColor).toBe(resolveToken('--border'));
    await expect(windowStyles.borderTopWidth).toBe('1px');
    await expect(windowStyles.borderRadius).toBe('8px');
    await expect(windowStyles.boxShadow).toBe('none');
    await expect(windowStyles.animationName).toBe('none');
    await expect(windowStyles.transitionDuration).toBe('0s');
    await expect(getComputedStyle(dialog.querySelector('[data-slot="dialog-header"]') as Element).paddingRight).toBe('36px');
    await expect(title.fontSize).toBe('20px');
    await expect(title.fontWeight).toBe('600');
    await expect(title.color).toBe(resolveToken('--foreground'));
    await expect(description.fontSize).toBe('14px');
    await expect(description.fontWeight).toBe('400');
    await expect(description.color).toBe(resolveToken('--muted-foreground'));
  },
};

export const ScrollsInsideAtNarrowWidth: Story = {
  ...LongContentNarrowScreen,
  name: 'Test: przy 320 px okno ma margines 16 px, przewija się wewnątrz, a strona za nim nie',
  play: async () => {
    const dialog = await screen.findByRole('dialog');
    const body = dialog.querySelector('[data-slot="dialog-body"]') as HTMLElement;
    const box = dialog.getBoundingClientRect();

    await expect(window.innerWidth).toBe(NARROW_WIDTH_PX);
    await expect(box.left).toBe(SIDE_MARGIN_PX);
    await expect(box.right).toBe(NARROW_WIDTH_PX - SIDE_MARGIN_PX);
    await expect(box.top).toBeGreaterThanOrEqual(SIDE_MARGIN_PX);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight - SIDE_MARGIN_PX);
    await expect(getComputedStyle(body).overflowY).toBe('auto');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
    await expect(getComputedStyle(document.body).overflow).toBe('hidden');

    body.scrollTop = body.scrollHeight;

    await expect(body.scrollTop).toBeGreaterThan(0);
    await expect(window.scrollY).toBe(0);
    await expect(screen.getByRole('button', { name: 'Rozumiem' }).getBoundingClientRect().bottom).toBeLessThanOrEqual(box.bottom);
    await expect(screen.getByRole('button', { name: CLOSE_LABEL }).getBoundingClientRect().top).toBeGreaterThanOrEqual(box.top);
  },
};

export const SavingFromFooterClosesAndCallsHandler: Story = {
  name: 'Test: przycisk głównej akcji w stopce wywołuje akcję i zamyka okno',
  render: () => <AmountDialog onSave={fn()} />,
  play: async ({ canvasElement }) => {
    await openFromTrigger(canvasElement);

    await userEvent.click(screen.getByRole('button', { name: 'Zapisz kwotę' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
