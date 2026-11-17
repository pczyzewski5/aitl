import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Input } from './input';

const TYPES = ['text', 'email', 'password', 'amount'] as const;
const TYPE_LABELS: Record<(typeof TYPES)[number], string> = {
  text: 'Tekst',
  email: 'E-mail',
  password: 'Hasło',
  amount: 'Kwota',
};
const CONTROL_HEIGHT_PX = 36;
const TWO_COLUMN_BREAKPOINT_PX = 768;
const SMALL_FONT_PX = '14px';
const BASE_FONT_PX = '16px';

function resolveToken(property: 'color' | 'backgroundColor' | 'borderTopColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/Input',
  component: Input,
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) =>
      parameters.ownSurface ? (
        <Story />
      ) : (
        <div className="max-w-sm rounded-card border border-border bg-card p-4">
          <Story />
        </div>
      ),
  ],
  args: { 'aria-label': 'Nazwa wpisu', placeholder: 'np. Czynsz (przykład)', onChange: fn() },
  argTypes: {
    type: { control: 'inline-radio', options: TYPES },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

function Column({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-col gap-(--space-between-fields)">{children}</div>;
}

export const Playground: Story = {};

export const Types: Story = {
  name: 'Typy',
  render: () => (
    <Column>
      <Input type="text" aria-label="Nazwa wpisu" placeholder="np. Czynsz (przykład)" />
      <Input type="email" aria-label="E-mail" autoComplete="email" placeholder="np. anna@example.com" />
      <Input type="password" aria-label="Hasło" autoComplete="current-password" />
      <Input type="amount" aria-label="Kwota" placeholder="np. 1234,50" />
    </Column>
  ),
};

const MATRIX_STATES = ['Domyślny', 'Fokus (podgląd)', 'Zablokowany', 'Tylko do odczytu', 'Błąd'] as const;

function stateInput(type: (typeof TYPES)[number], state: (typeof MATRIX_STATES)[number]) {
  const label = `${TYPE_LABELS[type]}: ${state}`;
  switch (state) {
    case 'Fokus (podgląd)':
      return <Input type={type} aria-label={label} data-preview-state="focus-visible" defaultValue="Czynsz" />;
    case 'Zablokowany':
      return <Input type={type} aria-label={label} disabled defaultValue="Czynsz" />;
    case 'Tylko do odczytu':
      return <Input type={type} aria-label={label} readOnly defaultValue="Czynsz" />;
    case 'Błąd':
      return <Input type={type} aria-label={label} aria-invalid defaultValue="Czynsz" />;
    default:
      return <Input type={type} aria-label={label} defaultValue="Czynsz" />;
  }
}

export const StatesMatrix: Story = {
  name: 'Macierz stanów',
  parameters: { ownSurface: true },
  render: () => (
    <div role="region" aria-label="Macierz stanów pola" tabIndex={0} className="overflow-x-auto rounded-card border border-border bg-card p-4">
      <table className="border-collapse text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="px-2 py-2 font-semibold">
              Typ
            </th>
            {MATRIX_STATES.map((state) => (
              <th key={state} scope="col" className="px-2 py-2 font-semibold">
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPES.map((type) => (
            <tr key={type} className="border-t border-border">
              <th scope="row" className="px-2 py-3 text-left font-semibold">
                {TYPE_LABELS[type]}
              </th>
              {MATRIX_STATES.map((state) => (
                <td key={state} className="px-2 py-3">
                  {stateInput(type, state)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

export const Placeholder: Story = {
  name: 'Placeholder tylko jako przykład formatu',
  args: { 'aria-label': 'Kwota', type: 'amount', placeholder: 'np. 1234,50' },
};

export const Disabled: Story = {
  name: 'Zablokowane',
  args: { disabled: true, defaultValue: 'Czynsz (przykład)', placeholder: undefined },
};

export const ReadOnly: Story = {
  name: 'Tylko do odczytu',
  args: { readOnly: true, defaultValue: 'anna@example.com', type: 'email', 'aria-label': 'E-mail konta' },
};

export const Invalid: Story = {
  name: 'Błąd (aria-invalid)',
  args: { 'aria-invalid': true, type: 'email', 'aria-label': 'E-mail', defaultValue: 'anna@' },
};

export const LongValueNarrowScreen: Story = {
  name: 'Długa wartość, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80 border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    defaultValue: 'Składka na ubezpieczenie mieszkania i sprzętu domowego, rata kwartalna (przykład)',
  },
};

interface ExampleProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function Example({ verdict, explanation, children }: ExampleProps) {
  return (
    <figure className="flex flex-1 flex-col gap-2 rounded-card border border-border bg-card p-4">
      <p className="font-semibold">{verdict}</p>
      <div className="flex flex-col gap-2">{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  parameters: { ownSurface: true },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Kwota jako pole tekstowe z klawiaturą dziesiętną: parser kwoty dostaje łańcuch, a przecinek działa.">
          <Input type="amount" aria-label="Kwota" placeholder="np. 1234,50" />
        </Example>
        <Example verdict="Źle" explanation="Placeholder zamiast nazwy pola: znika po wpisaniu, więc użytkownik nie wie, co wpisał. Etykietę zapewnia Field.">
          <Input aria-label="Kwota" placeholder="Kwota" />
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Pole leży na powierzchni karty (biel): ramka ma 3,18:1, więc granica pola jest widoczna.">
          <Input aria-label="Nazwa wpisu" />
        </Example>
        <Example verdict="Źle" explanation="Pole bezpośrednio na tle strony: ramka ma tylko 2,89:1, poniżej progu 3:1 (WCAG 1.4.11).">
          <div className="-m-4 bg-background p-4">
            <Input aria-label="Nazwa wpisu" />
          </div>
        </Example>
      </div>
    </div>
  ),
};

export const TypingUpdatesValue: Story = {
  name: 'Test: wpisywanie tekstu',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Nazwa wpisu' });

    await userEvent.click(input);
    await userEvent.type(input, 'Czynsz');

    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('Czynsz');
    await expect(args.onChange).toHaveBeenCalledTimes(6);
  },
};

export const KeyboardFocusAndEditing: Story = {
  name: 'Test: Tab ustawia fokus, klawisze edytują',
  args: { defaultValue: 'Czynsz' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Nazwa wpisu' });

    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('{End}{Backspace}{Backspace}');
    await userEvent.keyboard('X');

    await expect(input).toHaveValue('CzynX');
    await userEvent.tab();
    await expect(input).not.toHaveFocus();
  },
};

export const FocusRingUsesGlobalOutline: Story = {
  name: 'Test: fokus klawiaturą daje globalny obrys 2 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    const styles = getComputedStyle(canvas.getByRole('textbox', { name: 'Nazwa wpisu' }));

    await expect(styles.outlineWidth).toBe('2px');
    await expect(styles.outlineOffset).toBe('2px');
  },
};

export const DisabledIgnoresInput: Story = {
  name: 'Test: zablokowane nie przyjmuje fokusu ani tekstu',
  args: { disabled: true, defaultValue: 'Czynsz' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Nazwa wpisu' });

    await userEvent.tab();
    await userEvent.type(input, 'abc');

    await expect(input).toBeDisabled();
    await expect(input).not.toHaveFocus();
    await expect(input).toHaveValue('Czynsz');
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(input).cursor).toBe('not-allowed');
  },
};

export const ReadOnlyKeepsFocusButRejectsInput: Story = {
  name: 'Test: tylko do odczytu przyjmuje fokus, ale nie zmienia wartości',
  args: { readOnly: true, defaultValue: 'anna@example.com', type: 'email', 'aria-label': 'E-mail konta' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'E-mail konta' });

    await userEvent.tab();
    await userEvent.keyboard('abc');

    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute('readonly');
    await expect(input).toHaveValue('anna@example.com');
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(input).backgroundColor).toBe(resolveToken('backgroundColor', '--form-surface'));
  },
};

export const InvalidIsExposedToAssistiveTechnology: Story = {
  name: 'Test: aria-invalid i kolor ramki błędu',
  args: { 'aria-invalid': true, type: 'email', 'aria-label': 'E-mail' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'E-mail' });

    await expect(input).toBeInvalid();
    await expect(getComputedStyle(input).borderTopColor).toBe(resolveToken('borderTopColor', '--destructive'));
  },
};

export const AmountUsesDecimalKeyboard: Story = {
  name: 'Test: kwota to pole tekstowe z klawiaturą dziesiętną',
  args: { type: 'amount', 'aria-label': 'Kwota' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Kwota' });

    await userEvent.type(input, '1234,50');

    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveAttribute('inputmode', 'decimal');
    await expect(input).toHaveValue('1234,50');
  },
};

export const MeasuredHeightFontAndTokens: Story = {
  name: 'Test: wysokość 36 px, tekst 16 lub 14 px, ramka i tło z tokenów, bez cienia',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Nazwa wpisu' });
    const expectedFontSize = window.innerWidth >= TWO_COLUMN_BREAKPOINT_PX ? SMALL_FONT_PX : BASE_FONT_PX;

    const styles = getComputedStyle(input);

    await expect(input.getBoundingClientRect().height).toBe(CONTROL_HEIGHT_PX);
    await expect(styles.fontSize).toBe(expectedFontSize);
    await expect(styles.fontWeight).toBe('400');
    await expect(styles.borderRadius).toBe('6px');
    await expect(styles.borderTopWidth).toBe('1px');
    await expect(styles.borderTopColor).toBe(resolveToken('borderTopColor', '--input'));
    await expect(styles.backgroundColor).toBe(resolveToken('backgroundColor', '--card'));
    await expect(styles.boxShadow).toBe('none');
  },
};
