import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from './button';
import { Field } from './field';
import { Input } from './input';
import { ToastProvider, useToast } from './toast';

const CLOSE_LABEL = 'Zamknij';
const VIEWPORT_LABEL = 'Powiadomienia ({hotkey})';
const VIEWPORT_NAME = 'Powiadomienia (F8)';
const ANNOUNCEMENT_LABEL = 'Powiadomienie';
const SAVED_MESSAGE = 'Zapisano wpis Czynsz (przykład): 1 850,00 zł.';
const SECOND_MESSAGE = 'Zapisano wpis Internet (przykład): 59,00 zł.';
const TRIGGER_LABEL = 'Pokaż potwierdzenie';
const DURATION_TOKEN = '--toast-duration';
const DEFAULT_DURATION = '3000ms';
const PERSISTENT_DURATION = '3600000ms';
const SHORT_DURATION = '300ms';
const SHORT_DURATION_MS = 300;
const CONTROL_HEIGHT_PX = 36;
const NARROW_WIDTH_PX = 320;
const WIDE_WIDTH_PX = 1280;
const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const WIDE_VIEWPORT = { viewport: { value: 'desktop', isRotated: false } };
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 360 } };

function resolveToken(token: string, property: 'color' | 'backgroundColor' | 'width' = 'color'): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

function setDuration(value: string) {
  document.documentElement.style.setProperty(DURATION_TOKEN, value);
}

function resetDuration() {
  document.documentElement.style.removeProperty(DURATION_TOKEN);
}

interface DurationProps {
  readonly value: string;
  readonly children: ReactNode;
}

function Duration({ value, children }: DurationProps) {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setDuration(value);
    setReady(true);
    return resetDuration;
  }, [value]);

  return ready ? children : null;
}

interface ShowOnMountProps {
  readonly messages: readonly string[];
}

function ShowOnMount({ messages }: ShowOnMountProps) {
  const { toast } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) {
      return;
    }
    shown.current = true;
    messages.forEach((message) => toast({ message }));
  }, [messages, toast]);

  return null;
}

interface TriggerProps {
  readonly messages?: readonly string[];
}

function Trigger({ messages = [SAVED_MESSAGE] }: TriggerProps) {
  const { toast } = useToast();
  return (
    <Button onClick={() => messages.forEach((message) => toast({ message }))}>{TRIGGER_LABEL}</Button>
  );
}

interface PageProps {
  readonly children: ReactNode;
  readonly duration?: string;
}

function Page({ children, duration }: PageProps) {
  const content = (
    <ToastProvider closeLabel={CLOSE_LABEL} viewportLabel={VIEWPORT_LABEL} announcementLabel={ANNOUNCEMENT_LABEL}>
      <div className="flex min-h-64 flex-col items-start gap-(--space-between-groups)">{children}</div>
    </ToastProvider>
  );
  return duration ? <Duration value={duration}>{content}</Duration> : content;
}

const meta = {
  title: 'Elementy bazowe/Toast',
  component: ToastProvider,
  parameters: { layout: 'padded', docs: DOCS_IFRAME },
  args: {
    closeLabel: CLOSE_LABEL,
    viewportLabel: VIEWPORT_LABEL,
    announcementLabel: ANNOUNCEMENT_LABEL,
    children: null,
  },
  argTypes: {
    closeLabel: { control: 'text' },
    viewportLabel: { control: 'text' },
    announcementLabel: { control: 'text' },
    children: { control: false },
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <div className="min-h-64">
        <Trigger />
      </div>
    </ToastProvider>
  ),
};

export const Confirmation: Story = {
  name: 'Pojedyncze potwierdzenie (pozostaje widoczne tylko w dokumentacji)',
  render: () => (
    <Page duration={PERSISTENT_DURATION}>
      <ShowOnMount messages={[SAVED_MESSAGE]} />
    </Page>
  ),
};

export const Queued: Story = {
  name: 'Dwa potwierdzenia: widoczne jedno, drugie czeka w kolejce',
  render: () => (
    <Page duration={PERSISTENT_DURATION}>
      <ShowOnMount messages={[SAVED_MESSAGE, SECOND_MESSAGE]} />
    </Page>
  ),
};

const LONG_MESSAGE =
  'Zapisano wpis „Czynsz za mieszkanie wspólne z Anną i Piotrem za miesiące letnie”, szczegóły: https://example.com/bardzo/dlugi/adres/bez/spacji/w/komunikacie';

export const LongTextNarrowScreen: Story = {
  name: 'Długi tekst, wąski ekran (320 px)',
  globals: NARROW_VIEWPORT,
  render: () => (
    <Page duration={PERSISTENT_DURATION}>
      <ShowOnMount messages={[LONG_MESSAGE]} />
    </Page>
  ),
};

export const WideScreen: Story = {
  name: 'Szeroki ekran (1280 px): prawy dolny róg',
  globals: WIDE_VIEWPORT,
  render: Confirmation.render,
};

function EntryForm() {
  const { toast } = useToast();
  const [amount, setAmount] = useState('1 850,00');

  return (
    <form
      noValidate
      className="flex w-full max-w-sm flex-col gap-(--space-between-fields)"
      onSubmit={(event) => {
        event.preventDefault();
        toast({ message: `Zapisano wpis Czynsz (przykład): ${amount} zł.` });
      }}
    >
      <Field label="Kwota (zł)">
        <Input type="amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </Field>
      <div>
        <Button type="submit">Zapisz wpis</Button>
      </div>
    </form>
  );
}

export const EntrySaved: Story = {
  name: 'Potwierdzenie po zapisie wpisu (E02): fokus zostaje w formularzu',
  render: () => (
    <Page>
      <EntryForm />
    </Page>
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
      <div className="flex flex-wrap items-center gap-2 text-sm">{children}</div>
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
        <GoodBad verdict="Dobrze" explanation="Krótkie potwierdzenie rzeczy, która już się stała, z nazwą i kwotą wpisu.">
          <span>{SAVED_MESSAGE}</span>
        </GoodBad>
        <GoodBad verdict="Źle" explanation="Nie mówi, co zapisano, ani czego dotyczy; „Sukces!” nie jest informacją.">
          <span>Sukces!</span>
        </GoodBad>
      </div>
      <div className="flex flex-wrap gap-4">
        <GoodBad verdict="Dobrze" explanation="Błąd, który wymaga działania, zostaje na stronie: komunikat z przyciskiem ponowienia, który nie znika sam.">
          <span>Nie udało się zapisać wpisu. Spróbuj ponownie.</span>
          <Button variant="secondary">Spróbuj ponownie</Button>
        </GoodBad>
        <GoodBad verdict="Źle" explanation="Ten sam błąd w toaście zniknie po kilku sekundach, zanim użytkownik go przeczyta i zdąży coś zrobić.">
          <span>Nie udało się zapisać wpisu. Spróbuj ponownie.</span>
        </GoodBad>
      </div>
    </div>
  ),
};

function findMessage(message: string) {
  return screen.findByText(message);
}

async function showByClick(canvasElement: HTMLElement) {
  const trigger = within(canvasElement).getByRole('button', { name: TRIGGER_LABEL });
  trigger.focus();
  await userEvent.click(trigger);
  return { trigger, toast: await findMessage(SAVED_MESSAGE) };
}

export const AppearsAnnouncedPolitely: Story = {
  name: 'Test: toast pojawia się w regionie powiadomień, jest ogłaszany grzecznie (polite) i nie zabiera fokusu',
  render: Playground.render,
  play: async ({ canvasElement }) => {
    setDuration(PERSISTENT_DURATION);
    try {
      const { trigger } = await showByClick(canvasElement);

      const region = screen.getByRole('region', { name: VIEWPORT_NAME });
      await expect(within(region).getByRole('listitem')).toBeVisible();
      await waitFor(() =>
        expect(document.querySelector('[role="status"][aria-live="polite"]')?.textContent).toBe(`${ANNOUNCEMENT_LABEL} ${SAVED_MESSAGE}`),
      );
      await expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
      await expect(trigger).toHaveFocus();
    } finally {
      resetDuration();
    }
  },
};

export const ClosesItselfAfterTokenDuration: Story = {
  name: 'Test: toast znika sam po czasie z tokenu --toast-duration (3 s; w teście skrócone do 300 ms)',
  render: Playground.render,
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(document.documentElement).getPropertyValue(DURATION_TOKEN).trim()).toBe(DEFAULT_DURATION);
    setDuration(SHORT_DURATION);
    try {
      await showByClick(canvasElement);

      await waitFor(() => expect(screen.queryByText(SAVED_MESSAGE)).toBeNull(), { timeout: 3000 });
    } finally {
      resetDuration();
    }
  },
};

export const CloseButtonClosesAndIsLargeEnough: Story = {
  name: 'Test: przycisk „Zamknij” jest tekstem, ma co najmniej 36 px i zamyka toast',
  render: Playground.render,
  play: async ({ canvasElement }) => {
    setDuration(PERSISTENT_DURATION);
    try {
      await showByClick(canvasElement);
      const close = screen.getByRole('button', { name: CLOSE_LABEL });

      await expect(close).toHaveTextContent(CLOSE_LABEL);
      await expect(close.querySelector('svg')).toBeNull();
      await expect(close.getBoundingClientRect().height).toBeGreaterThanOrEqual(CONTROL_HEIGHT_PX);

      await userEvent.click(close);

      await waitFor(() => expect(screen.queryByText(SAVED_MESSAGE)).toBeNull());
    } finally {
      resetDuration();
    }
  },
};

export const ShowsOneAtATime: Story = {
  name: 'Test: widoczne jest jedno potwierdzenie, drugie pojawia się po zamknięciu pierwszego',
  render: () => (
    <Page>
      <Trigger messages={[SAVED_MESSAGE, SECOND_MESSAGE]} />
    </Page>
  ),
  play: async ({ canvasElement }) => {
    setDuration(PERSISTENT_DURATION);
    try {
      await showByClick(canvasElement);

      await expect(screen.getAllByRole('listitem')).toHaveLength(1);
      await expect(screen.queryByText(SECOND_MESSAGE)).toBeNull();

      await userEvent.click(screen.getByRole('button', { name: CLOSE_LABEL }));

      await expect(await findMessage(SECOND_MESSAGE)).toBeVisible();
      await expect(screen.queryByText(SAVED_MESSAGE)).toBeNull();
      await expect(screen.getAllByRole('listitem')).toHaveLength(1);
    } finally {
      resetDuration();
    }
  },
};

export const PausesOnHover: Story = {
  name: 'Test: odliczanie jest wstrzymane, gdy wskaźnik jest nad toastem (WCAG 2.2.1)',
  render: Playground.render,
  play: async ({ canvasElement }) => {
    setDuration(SHORT_DURATION);
    try {
      const { toast } = await showByClick(canvasElement);
      const region = screen.getByRole('region', { name: VIEWPORT_NAME });

      await userEvent.hover(toast);
      await new Promise((resolve) => setTimeout(resolve, SHORT_DURATION_MS * 3));

      await expect(screen.getByText(SAVED_MESSAGE)).toBeVisible();

      await userEvent.unhover(toast);
      region.dispatchEvent(new PointerEvent('pointerleave'));

      await waitFor(() => expect(screen.queryByText(SAVED_MESSAGE)).toBeNull(), { timeout: 3000 });
    } finally {
      resetDuration();
    }
  },
};

export const PausesOnFocusAndKeyboardReachesClose: Story = {
  name: 'Test: odliczanie jest wstrzymane przy fokusie; klawisz F8 przenosi do regionu, Tab do toastu i przycisku „Zamknij”',
  render: Playground.render,
  play: async ({ canvasElement }) => {
    setDuration(SHORT_DURATION);
    try {
      await showByClick(canvasElement);
      const region = screen.getByRole('region', { name: VIEWPORT_NAME });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true }));
      await waitFor(() => expect(region.querySelector('ol')).toHaveFocus());
      await new Promise((resolve) => setTimeout(resolve, SHORT_DURATION_MS * 3));

      await expect(screen.getByText(SAVED_MESSAGE)).toBeVisible();

      await userEvent.tab();
      await expect(screen.getByRole('listitem')).toHaveFocus();
      await userEvent.tab();
      await expect(screen.getByRole('button', { name: CLOSE_LABEL })).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      await waitFor(() => expect(screen.queryByText(SAVED_MESSAGE)).toBeNull());
    } finally {
      resetDuration();
    }
  },
};

export const SwipeDoesNotDismiss: Story = {
  name: 'Test: gest przesunięcia nie zamyka toastu (wyłączony)',
  render: Playground.render,
  play: async ({ canvasElement }) => {
    setDuration(PERSISTENT_DURATION);
    try {
      const { toast } = await showByClick(canvasElement);
      const item = screen.getByRole('listitem');
      const box = item.getBoundingClientRect();
      const start = { x: box.left + 20, y: box.top + 10 };

      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: toast, coords: { clientX: start.x, clientY: start.y } },
        { coords: { clientX: start.x + 150, clientY: start.y } },
        { coords: { clientX: start.x + 300, clientY: start.y } },
        { keys: '[/MouseLeft]' },
      ]);

      await expect(screen.getByText(SAVED_MESSAGE)).toBeVisible();
    } finally {
      resetDuration();
    }
  },
};

function expectSurface(item: HTMLElement) {
  const style = getComputedStyle(item);
  return Promise.all([
    expect(style.backgroundColor).toBe(resolveToken('--card', 'backgroundColor')),
    expect(style.borderTopColor).toBe(resolveToken('--border')),
    expect(style.color).toBe(resolveToken('--foreground')),
    expect(style.boxShadow).toBe('none'),
    expect(style.borderTopLeftRadius).toBe('8px'),
  ]);
}

export const NarrowScreenPositionAndTokens: Story = {
  ...LongTextNarrowScreen,
  name: 'Test: przy 320 px toast leży u dołu na szerokość ekranu minus margines z tokenu, kolory z tokenów, długi tekst się zawija',
  play: async () => {
    const item = await screen.findByRole('listitem');
    const box = item.getBoundingClientRect();
    const offset = parseFloat(resolveToken('--toast-viewport-offset', 'width'));

    await expect(window.innerWidth).toBe(NARROW_WIDTH_PX);
    await expect(offset).toBe(16);
    await expect(box.left).toBe(offset);
    await expect(box.right).toBe(NARROW_WIDTH_PX - offset);
    await expect(box.bottom).toBe(window.innerHeight - offset);
    await expectSurface(item);
    await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
  },
};

export const WideScreenPositionAndTokens: Story = {
  ...WideScreen,
  name: 'Test: przy 1280 px toast leży w prawym dolnym rogu, ma 384 px szerokości i margines z tokenu',
  play: async () => {
    const item = await screen.findByRole('listitem');
    const box = item.getBoundingClientRect();
    const offset = parseFloat(resolveToken('--toast-viewport-offset', 'width'));

    await expect(window.innerWidth).toBe(WIDE_WIDTH_PX);
    await expect(box.right).toBe(window.innerWidth - offset);
    await expect(box.bottom).toBe(window.innerHeight - offset);
    await expect(box.width).toBe(384);
    await expectSurface(item);
  },
};

export const EntrySavedKeepsFocus: Story = {
  ...EntrySaved,
  name: 'Test: po zapisie wpisu pojawia się potwierdzenie, a fokus zostaje na przycisku „Zapisz wpis”',
  play: async ({ canvasElement }) => {
    setDuration(PERSISTENT_DURATION);
    try {
      const submit = within(canvasElement).getByRole('button', { name: 'Zapisz wpis' });
      submit.focus();

      await userEvent.keyboard('{Enter}');

      await expect(await findMessage(SAVED_MESSAGE)).toBeVisible();
      await expect(submit).toHaveFocus();
    } finally {
      resetDuration();
    }
  },
};
