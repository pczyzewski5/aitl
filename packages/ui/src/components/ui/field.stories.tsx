import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Field } from './field';
import { Input } from './input';
import { Label } from './label';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_ERROR = 'Podaj adres e-mail w formacie nazwa@domena.pl.';
const AMOUNT_ERROR = 'Wpisz kwotę większą od zera, np. 1234,50.';
const LABEL_GAP_PX = 4;

const meta = {
  title: 'Elementy bazowe/Label i Field',
  component: Field,
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
  args: {
    label: 'E-mail',
    hint: 'Adres, którego używasz do logowania.',
    optional: false,
    children: <Input type="email" autoComplete="email" />,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    optional: { control: 'boolean' },
    optionalText: { control: 'text' },
    children: { control: false },
    id: { control: false },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

function Form({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-col gap-(--space-between-fields)">{children}</div>;
}

export const Playground: Story = {};

export const LabelOnly: Story = {
  name: 'Sama etykieta (Label)',
  render: () => (
    <div className="flex flex-col gap-(--space-label-field)">
      <Label htmlFor="label-only-input">Nazwa wpisu</Label>
      <Input id="label-only-input" />
    </div>
  ),
};

export const Required: Story = {
  name: 'Wymagane (domyślnie)',
  args: { label: 'Nazwa wpisu', hint: undefined, children: <Input /> },
};

export const Optional: Story = {
  name: 'Opcjonalne',
  args: { label: 'Opis', optional: true, hint: undefined, children: <Input /> },
};

export const WithHint: Story = {
  name: 'Z podpowiedzią',
  args: {
    label: 'Kwota',
    hint: 'Podaj kwotę w złotych, np. 1234,50.',
    children: <Input type="amount" />,
  },
};

export const WithError: Story = {
  name: 'Z błędem (co zrobić)',
  args: { label: 'E-mail', hint: undefined, error: EMAIL_ERROR, children: <Input type="email" defaultValue="anna@" /> },
};

export const WithHintAndError: Story = {
  name: 'Podpowiedź i błąd razem',
  args: {
    label: 'Kwota',
    hint: 'Podaj kwotę w złotych.',
    error: AMOUNT_ERROR,
    children: <Input type="amount" defaultValue="0" />,
  },
};

export const DisabledControl: Story = {
  name: 'Zablokowane pole',
  args: {
    label: 'Konto',
    hint: 'Konta nie da się zmienić po zapisaniu wpisu.',
    children: <Input disabled defaultValue="Konto wspólne (przykład)" />,
  },
};

export const ReadOnlyControl: Story = {
  name: 'Pole tylko do odczytu',
  args: { label: 'E-mail konta', hint: undefined, children: <Input readOnly type="email" defaultValue="anna@example.com" /> },
};

export const LoginForm: Story = {
  name: 'Formularz logowania (typowy układ)',
  render: () => (
    <Form>
      <Field label="E-mail">
        <Input type="email" autoComplete="email" />
      </Field>
      <Field label="Hasło">
        <Input type="password" autoComplete="current-password" />
      </Field>
    </Form>
  ),
};

export const EntryForm: Story = {
  name: 'Formularz wpisu (wymagane i opcjonalne)',
  render: () => (
    <Form>
      <Field label="Nazwa wpisu">
        <Input placeholder="np. Czynsz (przykład)" />
      </Field>
      <Field label="Kwota" hint="Podaj kwotę w złotych, np. 1234,50.">
        <Input type="amount" />
      </Field>
      <Field label="Opis" optional>
        <Input />
      </Field>
    </Form>
  ),
};

const MATRIX_ROWS: readonly { readonly name: string; readonly field: ReactNode }[] = [
  { name: 'Domyślny', field: <Field label="Nazwa wpisu"><Input /></Field> },
  { name: 'Opcjonalny', field: <Field label="Opis" optional><Input /></Field> },
  { name: 'Z podpowiedzią', field: <Field label="Kwota" hint="Np. 1234,50."><Input type="amount" /></Field> },
  { name: 'Fokus (podgląd)', field: <Field label="E-mail"><Input type="email" data-preview-state="focus-visible" /></Field> },
  { name: 'Zablokowany', field: <Field label="Konto"><Input disabled defaultValue="Konto wspólne (przykład)" /></Field> },
  { name: 'Tylko do odczytu', field: <Field label="E-mail konta"><Input readOnly defaultValue="anna@example.com" /></Field> },
  { name: 'Błąd', field: <Field label="E-mail" error={EMAIL_ERROR}><Input type="email" defaultValue="anna@" /></Field> },
];

export const StatesMatrix: Story = {
  name: 'Macierz stanów',
  parameters: { ownSurface: true },
  render: () => (
    <div className="grid grid-cols-1 gap-4 rounded-card border border-border bg-card p-4 md:grid-cols-2">
      {MATRIX_ROWS.map((row) => (
        <section key={row.name} aria-label={row.name} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{row.name}</h3>
          {row.field}
        </section>
      ))}
    </div>
  ),
};

function ValidatedEmailField() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  return (
    <Field label="E-mail" error={error}>
      <Input
        type="email"
        autoComplete="email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => setError(EMAIL_PATTERN.test(value) ? undefined : EMAIL_ERROR)}
      />
    </Field>
  );
}

export const ValidateOnBlur: Story = {
  name: 'Walidacja po opuszczeniu pola',
  render: () => <ValidatedEmailField />,
};

export const LongLabelNarrowScreen: Story = {
  name: 'Długa etykieta i błąd, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  render: () => (
    <div className="w-80 border border-border bg-card p-4">
      <Field
        label="Kwota miesięcznej raty za ubezpieczenie mieszkania i sprzętu domowego (przykład)"
        optional
        hint="Podaj kwotę w złotych, bez waluty, np. 1234,50. Jeśli rata jest kwartalna, podziel ją przez trzy."
        error="Wpisz kwotę jako liczbę, np. 1234,50. Litery i znaki waluty nie są dozwolone."
      >
        <Input type="amount" defaultValue="abc" />
      </Field>
    </div>
  ),
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
        <Example verdict="Dobrze" explanation="Widoczna etykieta nad polem; placeholder pokazuje tylko przykład formatu.">
          <Field label="Kwota">
            <Input type="amount" placeholder="np. 1234,50" />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Sam placeholder zamiast etykiety: znika po wpisaniu i nie jest nazwą pola.">
          <Input type="amount" aria-label="Kwota" placeholder="Kwota" />
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Błąd pod polem mówi, co zrobić, i jest powiązany z polem przez aria-describedby.">
          <Field label="E-mail" error={EMAIL_ERROR}>
            <Input type="email" defaultValue="anna@" />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Ogólny komunikat bez wskazania pola i bez instrukcji: użytkownik nie wie, co poprawić.">
          <Field label="E-mail" error="Błąd.">
            <Input type="email" defaultValue="anna@" />
          </Field>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Pole opcjonalne oznaczone słowami: „(opcjonalne)” obok etykiety, bez gwiazdki.">
          <Field label="Opis" optional>
            <Input />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Gwiazdka bez objaśnienia: symbol i kolor nie mówią, co oznaczają (A3), a wymagane są pola domyślnie.">
          <div className="flex flex-col gap-(--space-label-field)">
            <Label htmlFor="bad-star">Nazwa wpisu *</Label>
            <Input id="bad-star" />
          </div>
        </Example>
      </div>
    </div>
  ),
};

export const LabelNamesAndFocusesControl: Story = {
  name: 'Test: etykieta nazywa pole i kliknięcie ją fokusuje',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'E-mail' });

    await userEvent.click(canvas.getByText('E-mail'));

    await expect(input).toHaveFocus();
    await expect(input).toHaveAccessibleName('E-mail');
    await expect(input).toHaveAccessibleDescription('Adres, którego używasz do logowania.');
    await expect(input).toHaveAttribute('aria-required', 'true');
  },
};

export const OptionalMarkerIsPartOfName: Story = {
  name: 'Test: opcjonalne pole ma w nazwie słowo „opcjonalne”',
  args: { label: 'Opis', optional: true, hint: undefined, children: <Input /> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByRole('textbox', { name: 'Opis (opcjonalne)' });

    await expect(input).not.toHaveAttribute('aria-required');
  },
};

export const ErrorIsAnnouncedAndLinked: Story = {
  name: 'Test: błąd jest pod polem, powiązany i ogłaszany',
  args: { error: EMAIL_ERROR, children: <Input type="email" defaultValue="anna@" /> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'E-mail' });
    const error = canvas.getByRole('alert');

    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription(`Adres, którego używasz do logowania. ${EMAIL_ERROR}`);
    await expect(input.getAttribute('aria-describedby')).toContain(error.id);
    await expect(error).toHaveTextContent(EMAIL_ERROR);
    await expect(error.getBoundingClientRect().top).toBeGreaterThan(input.getBoundingClientRect().bottom);
    await expect(getComputedStyle(error).color).toBe(getComputedStyle(input).borderTopColor);
  },
};

export const ValidationAfterBlurShowsAndClearsError: Story = {
  name: 'Test: walidacja po opuszczeniu pola pokazuje i usuwa błąd',
  render: () => <ValidatedEmailField />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'E-mail' });

    await userEvent.type(input, 'anna@');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await userEvent.tab();

    await expect(canvas.getByRole('alert')).toHaveTextContent(EMAIL_ERROR);
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription(EMAIL_ERROR);

    await userEvent.type(input, 'example.com');
    await userEvent.tab();

    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(input).toBeValid();
    await expect(input).not.toHaveAttribute('aria-describedby');
  },
};

export const LabelToFieldGapIs4px: Story = {
  name: 'Test: odstęp etykieta-pole to 4 px (--space-label-field)',
  args: { hint: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('E-mail');
    const input = canvas.getByRole('textbox', { name: 'E-mail' });

    const actual = input.getBoundingClientRect().top - label.getBoundingClientRect().bottom;

    await expect(actual).toBe(LABEL_GAP_PX);
    await expect(getComputedStyle(label).fontWeight).toBe('600');
  },
};

export const DisabledControlIsNotFocusable: Story = {
  name: 'Test: zablokowane pole w Field nie przyjmuje fokusu',
  args: { label: 'Konto', hint: undefined, children: <Input disabled defaultValue="Konto wspólne (przykład)" /> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Konto' });

    await userEvent.tab();
    await userEvent.click(canvas.getByText('Konto'));

    await expect(input).toBeDisabled();
    await expect(input).not.toHaveFocus();
  },
};

export const ReadOnlyControlStaysFocusable: Story = {
  name: 'Test: pole tylko do odczytu w Field przyjmuje fokus przez etykietę',
  args: { label: 'E-mail konta', hint: undefined, children: <Input readOnly type="email" defaultValue="anna@example.com" /> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'E-mail konta' });

    await userEvent.click(canvas.getByText('E-mail konta'));
    await userEvent.keyboard('abc');

    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('anna@example.com');
  },
};
