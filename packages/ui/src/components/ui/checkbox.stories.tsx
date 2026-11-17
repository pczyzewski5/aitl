import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Checkbox } from './checkbox';
import { Field } from './field';

const CONTROL_HEIGHT_PX = 36;
const BOX_SIZE_PX = 20;
const MIN_TARGET_PX = 24;

function resolveToken(property: 'color' | 'backgroundColor' | 'borderTopColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/Checkbox',
  component: Checkbox,
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
  args: { label: 'Zapłacone', onCheckedChange: fn() },
  argTypes: {
    checked: { control: 'inline-radio', options: [true, false, 'indeterminate'] },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Checked: Story = { name: 'Zaznaczony', args: { defaultChecked: true } };

export const Indeterminate: Story = {
  name: 'Pośredni',
  args: { label: 'Wszystkie wydatki miesiąca (przykład)', defaultChecked: 'indeterminate' },
};

export const Disabled: Story = { name: 'Zablokowany', args: { disabled: true } };

export const DisabledChecked: Story = { name: 'Zablokowany i zaznaczony', args: { disabled: true, defaultChecked: true } };

export const DisabledIndeterminate: Story = {
  name: 'Zablokowany i pośredni',
  args: { disabled: true, defaultChecked: 'indeterminate' },
};

export const Invalid: Story = {
  name: 'Błąd (aria-invalid)',
  args: { label: 'Akceptuję regulamin (przykład)', 'aria-invalid': true },
};

export const FocusVisiblePreview: Story = {
  name: 'Fokus klawiaturą (podgląd)',
  args: { 'data-preview-state': 'focus-visible' } as Story['args'],
};

const MATRIX_ROWS = [
  { name: 'Niezaznaczony', checked: false },
  { name: 'Zaznaczony', checked: true },
  { name: 'Pośredni', checked: 'indeterminate' },
] as const;
const MATRIX_COLUMNS = ['Domyślny', 'Fokus (podgląd)', 'Zablokowany', 'Błąd'] as const;

function matrixCell(row: (typeof MATRIX_ROWS)[number], column: (typeof MATRIX_COLUMNS)[number]) {
  const label = `${row.name}: ${column}`;
  switch (column) {
    case 'Fokus (podgląd)':
      return <Checkbox label={label} defaultChecked={row.checked} data-preview-state="focus-visible" />;
    case 'Zablokowany':
      return <Checkbox label={label} defaultChecked={row.checked} disabled />;
    case 'Błąd':
      return row.checked === false ? (
        <Checkbox label={label} aria-invalid />
      ) : (
        <span className="text-sm text-muted-foreground">nie dotyczy</span>
      );
    default:
      return <Checkbox label={label} defaultChecked={row.checked} />;
  }
}

export const StatesMatrix: Story = {
  name: 'Macierz stanów',
  parameters: { ownSurface: true },
  render: () => (
    <div role="region" aria-label="Macierz stanów pola wyboru" tabIndex={0} className="overflow-x-auto rounded-card border border-border bg-card p-4">
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
            <tr key={row.name} className="border-t border-border">
              <th scope="row" className="px-2 py-3 text-left font-semibold">
                {row.name}
              </th>
              {MATRIX_COLUMNS.map((column) => (
                <td key={column} className="px-2 py-1">
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

export const LongLabelNarrowScreen: Story = {
  name: 'Długa etykieta, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80 border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    label:
      'Oznacz jako zapłacone dopiero po zaksięgowaniu przelewu na koncie wspólnym, także dla wydatków z poprzednich miesięcy (przykład)',
  },
};

export const InTableRow: Story = {
  name: 'W wierszu tabeli (nazwa z opisu wpisu)',
  parameters: { ownSurface: true },
  render: () => (
    <div role="region" aria-label="Wydatki miesiąca (przykład)" tabIndex={0} className="overflow-x-auto rounded-card border border-border bg-card p-4">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="px-2 py-2 font-semibold">
              Opis
            </th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">
              Kwota
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Zapłacone
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <th scope="row" className="px-2 py-1 text-left font-normal">
              Czynsz (przykład)
            </th>
            <td className="px-2 py-1 text-right">−2 100,00 zł</td>
            <td className="px-2 py-1">
              <Checkbox aria-label="Zapłacone: Czynsz (przykład)" defaultChecked />
            </td>
          </tr>
          <tr className="border-t border-border">
            <th scope="row" className="px-2 py-1 text-left font-normal">
              Prąd (przykład)
            </th>
            <td className="px-2 py-1 text-right">−240,50 zł</td>
            <td className="px-2 py-1">
              <Checkbox aria-label="Zapłacone: Prąd (przykład)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

export const InField: Story = {
  name: 'W polu formularza (Field: podpowiedź i błąd)',
  render: () => (
    <Field
      label="Zgody"
      hint="Bez tej zgody nie utworzymy konta."
      error="Zaznacz zgodę, aby kontynuować."
    >
      <Checkbox label="Akceptuję regulamin (przykład)" />
    </Field>
  ),
};

interface ListItem {
  readonly id: string;
  readonly label: string;
}

const LIST_ITEMS: readonly ListItem[] = [
  { id: 'rent', label: 'Czynsz (przykład)' },
  { id: 'power', label: 'Prąd (przykład)' },
  { id: 'internet', label: 'Internet (przykład)' },
];

function SelectAllList() {
  const [selected, setSelected] = useState<readonly string[]>(['rent']);
  const allSelected = selected.length === LIST_ITEMS.length;
  let state: boolean | 'indeterminate' = 'indeterminate';
  if (allSelected) {
    state = true;
  } else if (selected.length === 0) {
    state = false;
  }

  return (
    <fieldset className="flex flex-col">
      <legend className="mb-1 text-sm font-semibold">Wydatki do oznaczenia</legend>
      <Checkbox
        label="Wszystkie"
        checked={state}
        onCheckedChange={(checked) => setSelected(checked === true ? LIST_ITEMS.map((item) => item.id) : [])}
      />
      {LIST_ITEMS.map((item) => (
        <Checkbox
          key={item.id}
          label={item.label}
          checked={selected.includes(item.id)}
          onCheckedChange={(checked) =>
            setSelected((current) => (checked === true ? [...current, item.id] : current.filter((id) => id !== item.id)))
          }
        />
      ))}
    </fieldset>
  );
}

export const SelectAllGroup: Story = {
  name: 'Grupa z "Wszystkie" (stan pośredni)',
  render: () => <SelectAllList />,
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
        <Example verdict="Dobrze" explanation="Widoczna etykieta jest częścią celu kliknięcia: kliknięcie tekstu też przełącza pole.">
          <Checkbox label="Zapłacone" />
        </Example>
        <Example
          verdict="Źle"
          explanation="Sama etykieta obok pola, poza komponentem: cel kliknięcia ma tylko 20 px, a nazwa nie jest powiązana z polem."
        >
          <div className="flex items-center gap-2">
            <Checkbox aria-label="Pole" />
            <span>Zapłacone</span>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="W tabeli nazwa mówi, czego dotyczy pole: stan i opis wpisu w jednej nazwie.">
          <Checkbox aria-label="Zapłacone: Czynsz (przykład)" />
        </Example>
        <Example verdict="Źle" explanation="Nazwa „Zapłacone” powtórzona w każdym wierszu nie mówi, który wpis zmieniasz.">
          <Checkbox aria-label="Zapłacone" />
        </Example>
      </div>
    </div>
  ),
};

export const ClickToggles: Story = {
  name: 'Test: kliknięcie przełącza pole',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: 'Zapłacone' });

    await userEvent.click(checkbox);

    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(checkbox);

    await expect(checkbox).not.toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
  },
};

export const LabelClickToggles: Story = {
  name: 'Test: kliknięcie etykiety przełącza pole',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByText('Zapłacone'));

    await expect(canvas.getByRole('checkbox', { name: 'Zapłacone' })).toBeChecked();
  },
};

export const SpaceTogglesEnterDoesNot: Story = {
  name: 'Test: Tab ustawia fokus, spacja przełącza, Enter nie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: 'Zapłacone' });

    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(checkbox).not.toBeChecked();
    await userEvent.keyboard(' ');
    await expect(checkbox).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(checkbox).not.toBeChecked();
  },
};

export const FocusRingUsesGlobalOutline: Story = {
  name: 'Test: fokus klawiaturą daje globalny obrys 2 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    const styles = getComputedStyle(canvas.getByRole('checkbox', { name: 'Zapłacone' }));

    await expect(styles.outlineWidth).toBe('2px');
    await expect(styles.outlineOffset).toBe('2px');
    await expect(styles.outlineStyle).toBe('solid');
  },
};

export const IndeterminateIsMixedAndClickChecks: Story = {
  name: 'Test: pośredni to aria-checked "mixed" z kreską, kliknięcie zaznacza',
  args: { label: 'Wszystkie wydatki', defaultChecked: 'indeterminate' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: 'Wszystkie wydatki' });

    await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    await expect(checkbox).toBePartiallyChecked();
    await expect(getComputedStyle(checkbox.querySelector('.lucide-minus')!).display).not.toBe('none');
    await expect(getComputedStyle(checkbox.querySelector('.lucide-check')!).display).toBe('none');

    await userEvent.click(checkbox);

    await expect(checkbox).toBeChecked();
    await expect(getComputedStyle(checkbox.querySelector('.lucide-check')!).display).not.toBe('none');
  },
};

export const DisabledIgnoresInput: Story = {
  name: 'Test: zablokowane nie przyjmuje fokusu ani kliknięcia',
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: 'Zapłacone' });

    await userEvent.tab();
    await userEvent.click(canvas.getByText('Zapłacone'));
    await userEvent.keyboard(' ');

    await expect(checkbox).toBeDisabled();
    await expect(checkbox).not.toHaveFocus();
    await expect(checkbox).not.toBeChecked();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
    await expect(getComputedStyle(checkbox).cursor).toBe('not-allowed');
    await expect(getComputedStyle(checkbox).backgroundColor).toBe(resolveToken('backgroundColor', '--muted'));
  },
};

export const InvalidIsExposedToAssistiveTechnology: Story = {
  name: 'Test: aria-invalid i kolor ramki błędu',
  args: { label: 'Akceptuję regulamin', 'aria-invalid': true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: 'Akceptuję regulamin' });

    await expect(checkbox).toBeInvalid();
    await expect(getComputedStyle(checkbox).borderTopColor).toBe(resolveToken('borderTopColor', '--destructive'));
  },
};

export const AccessibleNameFromLabelAndAriaLabel: Story = {
  name: 'Test: nazwa dostępna z etykiety albo z aria-label (tabela)',
  parameters: InTableRow.parameters,
  render: InTableRow.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const rent = canvas.getByRole('checkbox', { name: 'Zapłacone: Czynsz (przykład)' });
    const power = canvas.getByRole('checkbox', { name: 'Zapłacone: Prąd (przykład)' });

    await expect(rent).toBeChecked();
    await expect(power).not.toBeChecked();
    await userEvent.click(power);
    await expect(power).toBeChecked();
    await expect(rent).toBeChecked();
  },
};

export const FieldWiresHintAndError: Story = {
  name: 'Test: w Field pole jest opisane podpowiedzią i błędem',
  render: InField.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: /Akceptuję regulamin/ });

    await expect(checkbox).toBeInvalid();
    await expect(checkbox).toHaveAccessibleDescription('Bez tej zgody nie utworzymy konta. Zaznacz zgodę, aby kontynuować.');
  },
};

export const TargetSizes: Story = {
  name: 'Test: pole 20 px, cel kliknięcia 36 px (>= 24 px)',
  render: () => (
    <div className="flex flex-col items-start">
      <Checkbox label="Z etykietą" />
      <Checkbox aria-label="Bez etykiety" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const withLabel = canvas.getByRole('checkbox', { name: 'Z etykietą' });
    const withoutLabel = canvas.getByRole('checkbox', { name: 'Bez etykiety' });

    const boxRect = withLabel.getBoundingClientRect();
    const labelTarget = withLabel.closest('label')!.getBoundingClientRect();
    const bareTarget = withoutLabel.closest('label')!.getBoundingClientRect();

    await expect(boxRect.width).toBe(BOX_SIZE_PX);
    await expect(boxRect.height).toBe(BOX_SIZE_PX);
    await expect(labelTarget.height).toBeGreaterThanOrEqual(CONTROL_HEIGHT_PX);
    await expect(labelTarget.width).toBeGreaterThan(boxRect.width);
    await expect(bareTarget.width).toBe(CONTROL_HEIGHT_PX);
    await expect(bareTarget.height).toBe(CONTROL_HEIGHT_PX);
    await expect(Math.min(bareTarget.width, bareTarget.height)).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  },
};

export const MeasuredColoursAndShape: Story = {
  name: 'Test: kolory, ramka, promień i brak cienia z tokenów',
  render: () => (
    <div className="flex flex-col items-start">
      <Checkbox label="Pusty" />
      <Checkbox label="Zaznaczony" defaultChecked />
      <Checkbox label="Pośredni" defaultChecked="indeterminate" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const unchecked = getComputedStyle(canvas.getByRole('checkbox', { name: 'Pusty' }));
    const checkedBox = canvas.getByRole('checkbox', { name: 'Zaznaczony' });
    const checked = getComputedStyle(checkedBox);
    const indeterminate = getComputedStyle(canvas.getByRole('checkbox', { name: 'Pośredni' }));

    await expect(unchecked.borderTopColor).toBe(resolveToken('borderTopColor', '--input'));
    await expect(unchecked.backgroundColor).toBe(resolveToken('backgroundColor', '--card'));
    await expect(unchecked.borderTopWidth).toBe('1px');
    await expect(unchecked.borderTopLeftRadius).toBe('6px');
    await expect(unchecked.boxShadow).toBe('none');
    await expect(checked.backgroundColor).toBe(resolveToken('backgroundColor', '--primary'));
    await expect(checked.borderTopColor).toBe(resolveToken('borderTopColor', '--primary'));
    await expect(checked.color).toBe(resolveToken('color', '--primary-foreground'));
    await expect(getComputedStyle(checkedBox.querySelector('.lucide-check')!).stroke).toBe(
      resolveToken('color', '--primary-foreground'),
    );
    await expect(indeterminate.backgroundColor).toBe(resolveToken('backgroundColor', '--primary'));
    await expect(unchecked.fontWeight).toBe('400');
  },
};
