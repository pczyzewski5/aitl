import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Field } from './field';
import { Select } from './select';

const CONTROL_HEIGHT_PX = 36;
const MIN_TARGET_PX = 24;
const ARROW_SIZE_PX = 16;
const TWO_COLUMN_BREAKPOINT_PX = 768;
const SMALL_FONT_PX = '14px';
const BASE_FONT_PX = '16px';

const ENTRY_TYPES = [
  { value: 'income', label: 'Wpływ' },
  { value: 'expense', label: 'Wydatek' },
];

const MONTHS = [
  { value: '2026-01', label: 'styczeń 2026' },
  { value: '2026-02', label: 'luty 2026' },
  { value: '2026-03', label: 'marzec 2026' },
  { value: '2026-04', label: 'kwiecień 2026' },
  { value: '2026-05', label: 'maj 2026' },
  { value: '2026-06', label: 'czerwiec 2026' },
  { value: '2026-07', label: 'lipiec 2026' },
  { value: '2026-08', label: 'sierpień 2026' },
  { value: '2026-09', label: 'wrzesień 2026' },
  { value: '2026-10', label: 'październik 2026' },
  { value: '2026-11', label: 'listopad 2026' },
  { value: '2026-12', label: 'grudzień 2026' },
];

const LONG_OPTIONS = [
  {
    value: 'insurance',
    label: 'Składka na ubezpieczenie mieszkania i sprzętu domowego, rata kwartalna (przykład)',
  },
  { value: 'rent', label: 'Czynsz (przykład)' },
];

function resolveToken(property: 'color' | 'backgroundColor' | 'borderTopColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/Select',
  component: Select,
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
  args: { 'aria-label': 'Typ wpisu', options: ENTRY_TYPES, onChange: fn() },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const EntryType: Story = {
  name: 'Typ wpisu (Wpływ, Wydatek)',
  render: () => (
    <Field label="Typ wpisu">
      <Select options={ENTRY_TYPES} defaultValue="expense" />
    </Field>
  ),
};

export const Month: Story = {
  name: 'Miesiąc (12 opcji jako dane)',
  render: () => (
    <Field label="Miesiąc">
      <Select options={MONTHS} defaultValue="2026-11" />
    </Field>
  ),
};

export const WithPlaceholderOption: Story = {
  name: 'Z pustą opcją "Wybierz…"',
  render: () => (
    <Field label="Typ wpisu">
      <Select options={ENTRY_TYPES} placeholder="Wybierz…" />
    </Field>
  ),
};

export const Disabled: Story = {
  name: 'Zablokowany',
  args: { disabled: true, defaultValue: 'expense' },
};

export const InvalidInField: Story = {
  name: 'Błąd w Field (aria-invalid, komunikat pod polem)',
  render: () => (
    <Field label="Typ wpisu" error="Wybierz typ wpisu: wpływ albo wydatek.">
      <Select options={ENTRY_TYPES} placeholder="Wybierz…" />
    </Field>
  ),
};

export const InFieldWithHintAndOptional: Story = {
  name: 'W polu formularza (podpowiedź, opcjonalne)',
  render: () => (
    <Field label="Miesiąc rozliczenia" hint="Wpis trafi do wybranego miesiąca." optional>
      <Select options={MONTHS} placeholder="Wybierz…" />
    </Field>
  ),
};

export const FocusVisiblePreview: Story = {
  name: 'Fokus klawiaturą (podgląd)',
  args: { 'data-preview-state': 'focus-visible' } as Story['args'],
};

const MATRIX_ROWS = ['Z wybraną wartością', 'Z pustą opcją'] as const;
const MATRIX_COLUMNS = ['Domyślny', 'Fokus (podgląd)', 'Zablokowany', 'Błąd'] as const;

function matrixCell(row: (typeof MATRIX_ROWS)[number], column: (typeof MATRIX_COLUMNS)[number]) {
  const label = `${row}: ${column}`;
  const placeholder = row === 'Z pustą opcją' ? 'Wybierz…' : undefined;
  const defaultValue = row === 'Z pustą opcją' ? '' : 'expense';
  switch (column) {
    case 'Fokus (podgląd)':
      return (
        <Select
          aria-label={label}
          options={ENTRY_TYPES}
          placeholder={placeholder}
          defaultValue={defaultValue}
          data-preview-state="focus-visible"
        />
      );
    case 'Zablokowany':
      return <Select aria-label={label} options={ENTRY_TYPES} placeholder={placeholder} defaultValue={defaultValue} disabled />;
    case 'Błąd':
      return <Select aria-label={label} options={ENTRY_TYPES} placeholder={placeholder} defaultValue={defaultValue} aria-invalid />;
    default:
      return <Select aria-label={label} options={ENTRY_TYPES} placeholder={placeholder} defaultValue={defaultValue} />;
  }
}

export const StatesMatrix: Story = {
  name: 'Macierz stanów',
  parameters: { ownSurface: true },
  render: () => (
    <div role="region" aria-label="Macierz stanów listy wyboru" tabIndex={0} className="overflow-x-auto rounded-card border border-border bg-card p-4">
      <table className="border-collapse text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="px-2 py-2 font-semibold">
              Wartość
            </th>
            {MATRIX_COLUMNS.map((column) => (
              <th key={column} scope="col" className="px-2 py-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MATRIX_ROWS.map((row) => (
            <tr key={row} className="border-t border-border">
              <th scope="row" className="px-2 py-3 text-left font-semibold">
                {row}
              </th>
              {MATRIX_COLUMNS.map((column) => (
                <td key={column} className="min-w-44 px-2 py-3">
                  {matrixCell(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

export const LongOptionNarrowScreen: Story = {
  name: 'Długa opcja, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80 border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: { 'aria-label': 'Wpis do skopiowania', options: LONG_OPTIONS, defaultValue: 'insurance' },
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
        <Example verdict="Dobrze" explanation="Miesiąc to 12 opcji z domyślnym bieżącym miesiącem: lista rozwijana oszczędza miejsce, a użytkownik nie musi nic wybierać.">
          <Field label="Miesiąc">
            <Select options={MONTHS} defaultValue="2026-11" />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Pusta opcja przy polu, które ma sensowną wartość domyślną: wymusza zbędny wybór i błąd, gdy użytkownik go pominie.">
          <Field label="Miesiąc">
            <Select options={MONTHS} placeholder="Wybierz…" />
          </Field>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Widoczna etykieta z Field: nazwa pola jest stale widoczna i powiązana z listą.">
          <Field label="Typ wpisu">
            <Select options={ENTRY_TYPES} defaultValue="expense" />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Pusta opcja „Wybierz…” zamiast etykiety: po wyborze nazwa pola znika, więc nie wiadomo, czego dotyczy wartość.">
          <Select aria-label="Typ wpisu" options={ENTRY_TYPES} placeholder="Typ wpisu" />
        </Example>
      </div>
    </div>
  ),
};

export const TabFocusAndKeyboardSelection: Story = {
  name: 'Test: Tab ustawia fokus, wybór opcji z fokusu zmienia wartość, Tab wychodzi',
  render: () => (
    <Field label="Miesiąc">
      <Select options={MONTHS} defaultValue="2026-03" onChange={fn()} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Miesiąc' });

    await userEvent.tab();
    await expect(select).toHaveFocus();
    await expect(select.tagName).toBe('SELECT');
    await userEvent.selectOptions(select, 'grudzień 2026');
    await expect(select).toHaveValue('2026-12');
    await expect(select).toHaveFocus();
    await userEvent.tab();
    await expect(select).not.toHaveFocus();
  },
};

export const ChangeEventReportsValue: Story = {
  name: 'Test: wybór opcji wywołuje onChange z wartością',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Typ wpisu' });

    await userEvent.selectOptions(select, 'expense');

    await expect(select).toHaveValue('expense');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('option', { name: 'Wydatek' })).toHaveProperty('selected', true);
  },
};

function ControlledEntryType() {
  const [value, setValue] = useState('income');

  return (
    <div className="flex flex-col gap-2">
      <Field label="Typ wpisu">
        <Select options={ENTRY_TYPES} value={value} onChange={(event) => setValue(event.target.value)} />
      </Field>
      <p className="text-sm text-muted-foreground">Wybrano: {value === 'income' ? 'wpływ' : 'wydatek'}</p>
    </div>
  );
}

export const ControlledUsage: Story = {
  name: 'Test: sterowane z stanu Reacta',
  render: () => <ControlledEntryType />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Typ wpisu' }), 'expense');

    await expect(canvas.getByText('Wybrano: wydatek')).toBeVisible();
  },
};

export const LabelIsAssociatedAndGivesName: Story = {
  name: 'Test: etykieta nazywa pole i kliknięcie etykiety daje fokus',
  render: () => (
    <Field label="Typ wpisu" hint="Wpływ zwiększa saldo, wydatek je zmniejsza.">
      <Select options={ENTRY_TYPES} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Typ wpisu' });

    await expect(canvas.getByLabelText('Typ wpisu')).toBe(select);
    await expect(select).toHaveAttribute('id');
    await expect(select).toHaveAccessibleDescription('Wpływ zwiększa saldo, wydatek je zmniejsza.');
    await expect(select).toHaveAttribute('aria-required', 'true');
    await userEvent.click(canvas.getByText('Typ wpisu'));
    await expect(select).toHaveFocus();
  },
};

export const FocusRingUsesGlobalOutline: Story = {
  name: 'Test: fokus klawiaturą daje globalny obrys 2 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    const styles = getComputedStyle(canvas.getByRole('combobox', { name: 'Typ wpisu' }));

    await expect(styles.outlineWidth).toBe('2px');
    await expect(styles.outlineOffset).toBe('2px');
    await expect(styles.outlineStyle).toBe('solid');
  },
};

export const DisabledIgnoresInput: Story = {
  name: 'Test: zablokowane nie przyjmuje fokusu ani zmiany',
  args: { disabled: true, defaultValue: 'income' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Typ wpisu' });

    await userEvent.tab();
    await userEvent.selectOptions(select, 'expense');

    await expect(select).toBeDisabled();
    await expect(select).not.toHaveFocus();
    await expect(select).toHaveValue('income');
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(select).cursor).toBe('not-allowed');
    await expect(getComputedStyle(select).backgroundColor).toBe(resolveToken('backgroundColor', '--muted'));
    await expect(getComputedStyle(select).color).toBe(resolveToken('color', '--muted-foreground'));
  },
};

export const InvalidIsLinkedToMessage: Story = {
  name: 'Test: błąd ma aria-invalid, aria-describedby i czerwoną ramkę',
  render: () => (
    <Field label="Typ wpisu" error="Wybierz typ wpisu: wpływ albo wydatek.">
      <Select options={ENTRY_TYPES} placeholder="Wybierz…" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Typ wpisu' });
    const message = canvas.getByRole('alert');

    await expect(select).toBeInvalid();
    await expect(select).toHaveAttribute('aria-describedby', message.id);
    await expect(select).toHaveAccessibleDescription('Wybierz typ wpisu: wpływ albo wydatek.');
    await expect(getComputedStyle(select).borderTopColor).toBe(resolveToken('borderTopColor', '--destructive'));
    await expect(message.textContent).not.toBe('');
  },
};

export const ArrowIsDecorativeAndDoesNotOverlapText: Story = {
  name: 'Test: strzałka 16 px jest aria-hidden, nie przechwytuje kliknięć i nie nachodzi na tekst',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Typ wpisu' });
    const arrow = canvasElement.querySelector('[data-slot="select-arrow"]') as SVGElement;

    const selectBox = select.getBoundingClientRect();
    const arrowBox = arrow.getBoundingClientRect();
    const styles = getComputedStyle(select);
    const textRight = selectBox.right - parseFloat(styles.borderRightWidth) - parseFloat(styles.paddingRight);

    await expect(arrow).toHaveAttribute('aria-hidden', 'true');
    await expect(getComputedStyle(arrow).pointerEvents).toBe('none');
    await expect(arrowBox.width).toBe(ARROW_SIZE_PX);
    await expect(arrowBox.height).toBe(ARROW_SIZE_PX);
    await expect(arrowBox.left).toBeGreaterThanOrEqual(textRight);
    await expect(arrowBox.right).toBeLessThanOrEqual(selectBox.right);
    await expect(getComputedStyle(arrow).color).toBe(resolveToken('color', '--foreground'));
  },
};

export const MeasuredSizeAndTokens: Story = {
  name: 'Test: wysokość 36 px (cel >= 24 px), tekst 16 lub 14 px, ramka, tło i promień z tokenów, bez cienia',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Typ wpisu' });
    const expectedFontSize = window.innerWidth >= TWO_COLUMN_BREAKPOINT_PX ? SMALL_FONT_PX : BASE_FONT_PX;

    const styles = getComputedStyle(select);
    const box = select.getBoundingClientRect();

    await expect(box.height).toBe(CONTROL_HEIGHT_PX);
    await expect(box.height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    await expect(box.width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    await expect(styles.fontSize).toBe(expectedFontSize);
    await expect(styles.fontWeight).toBe('400');
    await expect(styles.borderRadius).toBe('6px');
    await expect(styles.borderTopWidth).toBe('1px');
    await expect(styles.borderTopColor).toBe(resolveToken('borderTopColor', '--input'));
    await expect(styles.backgroundColor).toBe(resolveToken('backgroundColor', '--card'));
    await expect(styles.color).toBe(resolveToken('color', '--foreground'));
    await expect(styles.boxShadow).toBe('none');
  },
};
