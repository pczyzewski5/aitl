import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from './button';
import { Field } from './field';
import { Input } from './input';
import { RadioGroup } from './radio-group';

const CONTROL_HEIGHT_PX = 36;
const CIRCLE_SIZE_PX = 20;
const DOT_SIZE_PX = 8;
const MIN_TARGET_PX = 24;
const NARROW_WIDTH_PX = 320;
const WIDE_WIDTH_PX = 480;
const ARROW_HOLD_MS = 50;

async function pressArrow(key: 'ArrowDown' | 'ArrowUp' | 'ArrowLeft' | 'ArrowRight') {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, ARROW_HOLD_MS));
  await userEvent.keyboard(`{/${key}}`);
}

function resolveToken(property: 'color' | 'backgroundColor' | 'borderTopColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const ENTRY_TYPES = [
  { value: 'income', label: 'Wpływ' },
  { value: 'expense', label: 'Wydatek' },
];

const RECURRENCES = [
  { value: 'none', label: 'Jednorazowy' },
  { value: 'monthly', label: 'Co miesiąc' },
];

const RECURRENCES_WITH_HINTS = [
  { value: 'none', label: 'Jednorazowy', hint: 'Wpis dotyczy jednego miesiąca.' },
  { value: 'monthly', label: 'Co miesiąc', hint: 'Zapisz raz, a wpis pojawi się w każdym kolejnym miesiącu.' },
];

const CHANGE_SCOPES = [
  { value: 'month', label: 'Tylko ten miesiąc' },
  { value: 'from-month', label: 'Od tego miesiąca' },
  { value: 'series', label: 'Cała seria' },
];

const LONG_LABELS = [
  {
    value: 'one',
    label: 'Wpis jednorazowy, który dotyczy tylko jednego miesiąca i nie będzie powtarzany w kolejnych (przykład)',
  },
  {
    value: 'monthly',
    label: 'Wpis cykliczny zapisany raz, widoczny w każdym kolejnym miesiącu aż do jego zakończenia (przykład)',
  },
];

const meta = {
  title: 'Elementy bazowe/RadioGroup',
  component: RadioGroup,
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) =>
      parameters.ownSurface ? (
        <Story />
      ) : (
        <div className="max-w-md rounded-card border border-border bg-card p-4">
          <Story />
        </div>
      ),
  ],
  args: { legend: 'Typ wpisu', options: ENTRY_TYPES, onValueChange: fn() },
  argTypes: {
    disabled: { control: 'boolean' },
    optional: { control: 'boolean' },
    hint: { control: 'text' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Selected: Story = { name: 'Zaznaczona opcja', args: { defaultValue: 'income' } };

export const Disabled: Story = { name: 'Zablokowana grupa', args: { disabled: true, defaultValue: 'income' } };

export const DisabledOption: Story = {
  name: 'Zablokowana jedna opcja',
  args: {
    legend: 'Cykliczność',
    options: [
      { value: 'none', label: 'Jednorazowy' },
      { value: 'monthly', label: 'Co miesiąc', disabled: true },
    ],
    defaultValue: 'none',
    hint: 'Wpisy cykliczne są dostępne po wybraniu konta.',
  },
};

export const Invalid: Story = {
  name: 'Błąd (komunikat pod grupą)',
  args: { error: 'Wybierz typ wpisu: wpływ albo wydatek.' },
};

export const FocusVisiblePreview: Story = {
  name: 'Fokus klawiaturą (podgląd)',
  args: { defaultValue: 'income', 'data-preview-state': 'focus-visible' } as Story['args'],
};

export const EntryTypeHorizontal: Story = {
  name: 'Typ wpisu: dwie opcje obok siebie',
  args: { legend: 'Typ wpisu', options: ENTRY_TYPES, defaultValue: 'expense' },
};

export const Recurrence: Story = {
  name: 'Cykliczność: dwie opcje z opisem',
  args: { legend: 'Cykliczność', options: RECURRENCES_WITH_HINTS, defaultValue: 'none' },
};

export const ThreeOptionsVertical: Story = {
  name: 'Trzy opcje: jedna pod drugą',
  args: {
    legend: 'Zakres zmiany kwoty (przykład)',
    options: CHANGE_SCOPES,
    defaultValue: 'from-month',
    hint: 'Zmiana nie dotyka miesięcy, które już minęły.',
  },
};

export const Optional: Story = {
  name: 'Pole opcjonalne',
  args: { legend: 'Cykliczność', options: RECURRENCES, optional: true },
};

export const LongLabelsNarrowScreen: Story = {
  name: 'Długie etykiety, wąski ekran (320 px, zawsze pionowo)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80 border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: { legend: 'Cykliczność', options: LONG_LABELS, defaultValue: 'one' },
};

const MATRIX_ROWS = [
  { name: 'Brak wyboru', value: undefined },
  { name: 'Wybrana opcja', value: 'income' },
] as const;
const MATRIX_COLUMNS = ['Domyślny', 'Fokus (podgląd)', 'Zablokowany', 'Błąd'] as const;

function matrixCell(row: (typeof MATRIX_ROWS)[number], column: (typeof MATRIX_COLUMNS)[number]) {
  const legend = `${row.name}: ${column}`;
  switch (column) {
    case 'Fokus (podgląd)':
      return row.value === undefined ? (
        <span className="text-sm text-muted-foreground">nie dotyczy</span>
      ) : (
        <RadioGroup legend={legend} options={ENTRY_TYPES} defaultValue={row.value} data-preview-state="focus-visible" />
      );
    case 'Zablokowany':
      return <RadioGroup legend={legend} options={ENTRY_TYPES} defaultValue={row.value} disabled />;
    case 'Błąd':
      return <RadioGroup legend={legend} options={ENTRY_TYPES} defaultValue={row.value} error="Wybierz typ wpisu." />;
    default:
      return <RadioGroup legend={legend} options={ENTRY_TYPES} defaultValue={row.value} />;
  }
}

export const StatesMatrix: Story = {
  name: 'Macierz stanów',
  parameters: { ownSurface: true },
  render: () => (
    <div
      role="region"
      aria-label="Macierz stanów grupy opcji"
      tabIndex={0}
      className="overflow-x-auto rounded-card border border-border bg-card p-4"
    >
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
            <tr key={row.name} className="border-t border-border align-top">
              <th scope="row" className="px-2 py-3 text-left font-semibold">
                {row.name}
              </th>
              {MATRIX_COLUMNS.map((column) => (
                <td key={column} className="px-2 py-2">
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

function EntryForm() {
  const [type, setType] = useState('expense');
  const [recurrence, setRecurrence] = useState('none');

  return (
    <form noValidate aria-label="Dodaj wpis (przykład)" className="flex flex-col gap-(--space-between-fields)">
      <Field label="Opis">
        <Input type="text" name="description" defaultValue="Czynsz (przykład)" />
      </Field>
      <RadioGroup legend="Typ wpisu" name="type" options={ENTRY_TYPES} value={type} onValueChange={setType} />
      <RadioGroup
        legend="Cykliczność"
        name="recurrence"
        options={RECURRENCES_WITH_HINTS}
        value={recurrence}
        onValueChange={setRecurrence}
      />
      <div>
        <Button type="submit">Dodaj</Button>
      </div>
    </form>
  );
}

export const InForm: Story = {
  name: 'W formularzu wpisu (legenda jak etykieta pola)',
  render: () => <EntryForm />,
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
        <Example
          verdict="Dobrze"
          explanation="Dwie opcje, jedna do wyboru: grupa z widoczną legendą, kliknięcie tekstu też wybiera opcję."
        >
          <RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />
        </Example>
        <Example
          verdict="Źle"
          explanation="Pojedyncze pole wyboru udające grupę: nie ma legendy, nie ma wspólnej nazwy ani strzałek między opcjami."
        >
          <div className="flex gap-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="bad-type" /> Wpływ
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="bad-type" /> Wydatek
            </label>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example
          verdict="Dobrze"
          explanation="Jedna opcja do wyboru z kilku, każda widoczna od razu: RadioGroup."
        >
          <RadioGroup legend="Zakres zmiany kwoty (przykład)" options={CHANGE_SCOPES} defaultValue="month" />
        </Example>
        <Example
          verdict="Źle"
          explanation="Niezależne opcje, które można włączyć razem (np. zgody), to nie jest wybór jednej z kilku: Checkbox, nie RadioGroup."
        >
          <RadioGroup
            legend="Powiadomienia (przykład)"
            options={[
              { value: 'email', label: 'E-mail' },
              { value: 'sms', label: 'SMS' },
              { value: 'push', label: 'Powiadomienie w aplikacji' },
            ]}
          />
        </Example>
      </div>
    </div>
  ),
};

export const ClickSelects: Story = {
  name: 'Test: kliknięcie opcji i etykiety wybiera opcję',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('radio', { name: 'Wydatek' }));

    await expect(canvas.getByRole('radio', { name: 'Wydatek' })).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('expense');

    await userEvent.click(canvas.getByText('Wpływ'));

    await expect(canvas.getByRole('radio', { name: 'Wpływ' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Wydatek' })).not.toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('income');
  },
};

export const KeyboardNavigation: Story = {
  name: 'Test: Tab wchodzi raz, strzałki zmieniają wybór, spacja wybiera, Tab wychodzi',
  args: { legend: 'Cykliczność', options: [...RECURRENCES, { value: 'yearly', label: 'Co rok' }] },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary">
        Przed grupą
      </Button>
      <RadioGroup {...args} />
      <Button type="button" variant="secondary">
        Po grupie
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const none = canvas.getByRole('radio', { name: 'Jednorazowy' });
    const monthly = canvas.getByRole('radio', { name: 'Co miesiąc' });
    const yearly = canvas.getByRole('radio', { name: 'Co rok' });

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Przed grupą' })).toHaveFocus();

    await userEvent.tab();
    await expect(none).toHaveFocus();
    await expect(none).not.toBeChecked();

    await userEvent.keyboard(' ');
    await expect(none).toBeChecked();

    await pressArrow('ArrowDown');
    await expect(monthly).toHaveFocus();
    await expect(monthly).toBeChecked();
    await expect(none).not.toBeChecked();

    await pressArrow('ArrowRight');
    await expect(yearly).toHaveFocus();
    await expect(yearly).toBeChecked();

    await pressArrow('ArrowDown');
    await expect(none).toHaveFocus();
    await expect(none).toBeChecked();

    await pressArrow('ArrowUp');
    await expect(yearly).toBeChecked();

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Po grupie' })).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(yearly).toHaveFocus();
    await expect(monthly.tabIndex).toBe(-1);
    await expect(none.tabIndex).toBe(-1);
  },
};

export const EnterDoesNotSelect: Story = {
  name: 'Test: Enter nie wybiera opcji',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    await expect(canvas.getByRole('radio', { name: 'Wpływ' })).toHaveFocus();
    await expect(canvas.getByRole('radio', { name: 'Wpływ' })).not.toBeChecked();
  },
};

export const FocusRingUsesGlobalOutline: Story = {
  name: 'Test: fokus klawiaturą daje globalny obrys 2 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    const styles = getComputedStyle(canvas.getByRole('radio', { name: 'Wpływ' }));

    await expect(styles.outlineWidth).toBe('2px');
    await expect(styles.outlineOffset).toBe('2px');
    await expect(styles.outlineStyle).toBe('solid');
  },
};

export const AccessibleGroupName: Story = {
  name: 'Test: nazwa grupy z legendy, opcje nazwane etykietami',
  args: { legend: 'Cykliczność', options: RECURRENCES_WITH_HINTS, hint: 'Typ można zmienić tylko dla nowego wpisu.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Cykliczność' });

    await expect(group.tagName).toBe('FIELDSET');
    await expect(group.querySelector('legend')).toHaveTextContent('Cykliczność');
    await expect(group).toHaveAccessibleDescription('Typ można zmienić tylko dla nowego wpisu.');
    await expect(canvas.getByRole('radio', { name: 'Co miesiąc' })).toHaveAccessibleDescription(
      'Zapisz raz, a wpis pojawi się w każdym kolejnym miesiącu.',
    );
    await expect(canvas.getAllByRole('radio')).toHaveLength(2);
  },
};

export const InvalidIsExposed: Story = {
  name: 'Test: aria-invalid, aria-describedby i ramka błędu',
  args: { error: 'Wybierz typ wpisu: wpływ albo wydatek.', hint: 'Typ decyduje o znaku kwoty.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Typ wpisu' });
    const circle = canvas.getByRole('radio', { name: 'Wpływ' });

    await expect(group).toBeInvalid();
    await expect(group).toHaveAccessibleDescription('Typ decyduje o znaku kwoty. Wybierz typ wpisu: wpływ albo wydatek.');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Wybierz typ wpisu: wpływ albo wydatek.');
    await expect(getComputedStyle(circle).borderTopColor).toBe(resolveToken('borderTopColor', '--destructive'));

    await userEvent.click(circle);

    const primary = resolveToken('borderTopColor', '--primary');

    await waitFor(() => expect(getComputedStyle(circle).borderTopColor).toBe(primary));
  },
};

export const DisabledIgnoresInput: Story = {
  name: 'Test: zablokowana grupa i opcja nie przyjmują fokusu ani kliknięcia',
  render: (args) => (
    <div className="flex flex-col gap-4">
      <RadioGroup {...args} legend="Grupa zablokowana" disabled defaultValue="income" />
      <RadioGroup
        {...args}
        legend="Jedna opcja zablokowana"
        options={[
          { value: 'income', label: 'Dostępna' },
          { value: 'expense', label: 'Zablokowana', disabled: true },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const disabledGroupRadio = within(canvas.getByRole('radiogroup', { name: 'Grupa zablokowana' })).getByRole('radio', {
      name: 'Wydatek',
    });
    const disabledOption = canvas.getByRole('radio', { name: 'Zablokowana' });

    await userEvent.click(within(canvas.getByRole('radiogroup', { name: 'Grupa zablokowana' })).getByText('Wydatek'));
    await userEvent.click(canvas.getByText('Zablokowana'));

    await expect(disabledGroupRadio).toBeDisabled();
    await expect(disabledGroupRadio).not.toBeChecked();
    await expect(disabledOption).toBeDisabled();
    await expect(disabledOption).not.toBeChecked();
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(disabledOption).cursor).toBe('not-allowed');
    await expect(getComputedStyle(disabledOption).backgroundColor).toBe(resolveToken('backgroundColor', '--muted'));
  },
};

export const TargetSizes: Story = {
  name: 'Test: koło 20 px, cel kliknięcia 36 px (>= 24 px)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const circle = canvas.getByRole('radio', { name: 'Wpływ' });

    const circleRect = circle.getBoundingClientRect();
    const target = circle.closest('label')!.getBoundingClientRect();

    await expect(circleRect.width).toBe(CIRCLE_SIZE_PX);
    await expect(circleRect.height).toBe(CIRCLE_SIZE_PX);
    await expect(target.height).toBeGreaterThanOrEqual(CONTROL_HEIGHT_PX);
    await expect(target.width).toBeGreaterThan(circleRect.width);
    await expect(Math.min(target.width, target.height)).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  },
};

export const MeasuredColoursAndShape: Story = {
  name: 'Test: kolory, ramka, okrągły kształt i kropka z tokenów',
  args: { defaultValue: 'income' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectedCircle = canvas.getByRole('radio', { name: 'Wpływ' });
    const selected = getComputedStyle(selectedCircle);
    const unchecked = getComputedStyle(canvas.getByRole('radio', { name: 'Wydatek' }));
    const dotElement = selectedCircle.querySelector('[data-slot="radio-group-indicator"]')!;
    const dot = getComputedStyle(dotElement);
    const dotRect = dotElement.getBoundingClientRect();

    await expect(unchecked.borderTopColor).toBe(resolveToken('borderTopColor', '--input'));
    await expect(unchecked.backgroundColor).toBe(resolveToken('backgroundColor', '--card'));
    await expect(unchecked.borderTopWidth).toBe('1px');
    await expect(unchecked.borderTopLeftRadius).toBe(`${CIRCLE_SIZE_PX / 2}px`);
    await expect(unchecked.boxShadow).toBe('none');
    await expect(unchecked.fontWeight).toBe('400');
    await expect(canvas.getByRole('radio', { name: 'Wydatek' }).querySelector('[data-slot="radio-group-indicator"]')).toBeNull();
    await expect(selected.backgroundColor).toBe(resolveToken('backgroundColor', '--primary'));
    await expect(selected.borderTopColor).toBe(resolveToken('borderTopColor', '--primary'));
    await expect(dot.backgroundColor).toBe(resolveToken('backgroundColor', '--primary-foreground'));
    await expect(dotRect.width).toBe(DOT_SIZE_PX);
    await expect(dotRect.height).toBe(DOT_SIZE_PX);
    await expect(parseFloat(dot.borderTopLeftRadius)).toBeGreaterThanOrEqual(DOT_SIZE_PX / 2);
  },
};

export const LayoutFollowsContainerWidth: Story = {
  name: 'Test: dwie opcje obok siebie, przy 320 px zawsze jedna pod drugą',
  parameters: { ownSurface: true },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div style={{ width: WIDE_WIDTH_PX }} data-testid="wide" className="border border-border bg-card p-4">
        <RadioGroup {...args} legend="Szeroko" />
      </div>
      <div style={{ width: NARROW_WIDTH_PX }} data-testid="narrow" className="border border-border bg-card p-4">
        <RadioGroup {...args} legend="Wąsko" options={LONG_LABELS} />
      </div>
      <div style={{ width: WIDE_WIDTH_PX }} data-testid="three" className="border border-border bg-card p-4">
        <RadioGroup {...args} legend="Trzy opcje" options={CHANGE_SCOPES} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const positions = (legend: string): [DOMRect, DOMRect] => {
      const [first, second] = within(canvas.getByRole('radiogroup', { name: legend })).getAllByRole('radio');

      return [first!.getBoundingClientRect(), second!.getBoundingClientRect()];
    };

    const [wideFirst, wideSecond] = positions('Szeroko');
    const [narrowFirst, narrowSecond] = positions('Wąsko');
    const [threeFirst, threeSecond] = positions('Trzy opcje');

    await expect(wideSecond.top).toBe(wideFirst.top);
    await expect(wideSecond.left).toBeGreaterThan(wideFirst.left);
    await expect(narrowSecond.left).toBe(narrowFirst.left);
    await expect(narrowSecond.top).toBeGreaterThan(narrowFirst.top);
    await expect(threeSecond.left).toBe(threeFirst.left);
    await expect(threeSecond.top).toBeGreaterThan(threeFirst.top);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};

export const FormSubmitsSelectedValue: Story = {
  name: 'Test: w formularzu wybór trafia do FormData',
  render: () => <EntryForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole('form', { name: 'Dodaj wpis (przykład)' }) as HTMLFormElement;

    await userEvent.click(canvas.getByRole('radio', { name: 'Wpływ' }));
    await userEvent.click(canvas.getByRole('radio', { name: /Co miesiąc/ }));

    const data = new FormData(form);

    await expect(data.get('type')).toBe('income');
    await expect(data.get('recurrence')).toBe('monthly');
    await expect(canvas.getByRole('radiogroup', { name: 'Typ wpisu' })).toBeVisible();
  },
};
