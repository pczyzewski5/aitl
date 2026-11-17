import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './button';

const VARIANTS = ['default', 'secondary', 'ghost', 'destructive'] as const;
const VARIANT_LABELS: Record<(typeof VARIANTS)[number], string> = {
  default: 'Główny',
  secondary: 'Drugoplanowy',
  ghost: 'Ghost',
  destructive: 'Usuwający',
};
const CONTROL_HEIGHT_PX = 36;
const meta = {
  title: 'Elementy bazowe/Button',
  component: Button,
  parameters: { layout: 'padded' },
  args: { children: 'Zapisz wpis', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    size: { control: 'inline-radio', options: ['default', 'icon'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    asChild: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

function Row({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export const Playground: Story = {};

export const Variants: Story = {
  name: 'Warianty',
  render: () => (
    <Row>
      <Button variant="default">Zaloguj</Button>
      <Button variant="secondary">Anuluj</Button>
      <Button variant="ghost">Wyczyść pola</Button>
      <Button variant="destructive">Usuń wpis</Button>
    </Row>
  ),
};

export const Sizes: Story = {
  name: 'Rozmiary',
  render: () => (
    <Row>
      <Button>Dodaj wpis</Button>
      <Button size="icon" variant="secondary" aria-label="Poprzedni miesiąc">
        <span aria-hidden="true">‹</span>
      </Button>
      <Button size="icon" variant="secondary" aria-label="Następny miesiąc">
        <span aria-hidden="true">›</span>
      </Button>
    </Row>
  ),
};

const MATRIX_STATES = ['Domyślny', 'Najechanie (podgląd)', 'Fokus (podgląd)', 'Zablokowany', 'Ładowanie'] as const;

function stateButton(variant: (typeof VARIANTS)[number], state: (typeof MATRIX_STATES)[number]) {
  switch (state) {
    case 'Najechanie (podgląd)':
      return (
        <Button variant={variant} data-preview-state="hover">
          Zapisz
        </Button>
      );
    case 'Fokus (podgląd)':
      return (
        <Button variant={variant} data-preview-state="focus-visible">
          Zapisz
        </Button>
      );
    case 'Zablokowany':
      return (
        <Button variant={variant} disabled>
          Zapisz
        </Button>
      );
    case 'Ładowanie':
      return (
        <Button variant={variant} loading>
          Zapisywanie…
        </Button>
      );
    default:
      return <Button variant={variant}>Zapisz</Button>;
  }
}

export const StatesMatrix: Story = {
  name: 'Macierz stanów',
  parameters: { layout: 'padded' },
  render: () => (
    <div role="region" aria-label="Macierz stanów przycisku" tabIndex={0} className="overflow-x-auto">
      <table className="border-collapse text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="px-2 py-2 font-semibold">
              Wariant
            </th>
            {MATRIX_STATES.map((state) => (
              <th key={state} scope="col" className="px-2 py-2 font-semibold">
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((variant) => (
            <tr key={variant} className="border-t border-border">
              <th scope="row" className="px-2 py-3 text-left font-semibold">
                {VARIANT_LABELS[variant]}
              </th>
              {MATRIX_STATES.map((state) => (
                <td key={state} className="px-2 py-3">
                  {stateButton(variant, state)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
      <Row>{children}</Row>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Jeden przycisk główny, obok drugoplanowy: widać, która akcja jest najważniejsza.">
          <Button>Zapisz wpis</Button>
          <Button variant="secondary">Anuluj</Button>
        </Example>
        <Example verdict="Źle" explanation="Dwa przyciski główne obok siebie: użytkownik nie wie, która akcja jest zalecana.">
          <Button>Zapisz wpis</Button>
          <Button>Anuluj</Button>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Czasownik i obiekt: wiadomo, co się stanie po kliknięciu.">
          <Button variant="destructive">Usuń wpis</Button>
        </Example>
        <Example verdict="Źle" explanation="„OK” nie mówi, co się stanie, zwłaszcza przy akcji, której nie da się cofnąć.">
          <Button variant="destructive">OK</Button>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Przycisk zablokowany ma obok powód i jest z nim powiązany przez aria-describedby.">
          <div className="flex flex-col gap-1">
            <Button disabled aria-describedby="good-reason">
              Dodaj wpis
            </Button>
            <p id="good-reason" className="text-sm text-muted-foreground">
              Wybierz konto, żeby dodać wpis.
            </p>
          </div>
        </Example>
        <Example verdict="Źle" explanation="Zablokowany bez słowa wyjaśnienia: użytkownik nie wie, co zrobić, żeby go odblokować.">
          <Button disabled>Dodaj wpis</Button>
        </Example>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  name: 'Zablokowany z wyjaśnieniem',
  render: () => (
    <div className="flex flex-col gap-1">
      <Button disabled aria-describedby="disabled-reason">
        Dodaj wpis
      </Button>
      <p id="disabled-reason" className="text-sm text-muted-foreground">
        Wybierz konto, żeby dodać wpis.
      </p>
    </div>
  ),
};

export const Loading: Story = {
  name: 'Ładowanie (wysyłanie)',
  render: () => (
    <Button loading type="submit">
      Logowanie…
    </Button>
  ),
};

export const LongLabelNarrowScreen: Story = {
  name: 'Długa etykieta, wąski ekran (320 px)',
  render: () => (
    <div className="w-80 border border-border bg-card p-4">
      <Button className="w-full">Dodaj wpis wydatku do konta wspólnego (przykład)</Button>
    </div>
  ),
};

export const AsLink: Story = {
  name: 'Link wyglądający jak przycisk (asChild)',
  render: () => (
    <Button asChild variant="secondary">
      <a href="#wroc-do-logowania">Wróć do logowania</a>
    </Button>
  ),
};

export const ClickCallsHandler: Story = {
  name: 'Test: kliknięcie wywołuje onClick',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zapisz wpis' }));

    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const KeyboardActivates: Story = {
  name: 'Test: Enter i spacja aktywują przycisk',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Zapisz wpis' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const DisabledIgnoresClick: Story = {
  name: 'Test: zablokowany nie reaguje',
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zapisz wpis' }));

    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const LoadingIgnoresClickAndKeepsFocus: Story = {
  name: 'Test: ładowanie blokuje ponowne wysłanie, ale zachowuje fokus',
  args: { loading: true, children: 'Zapisywanie…' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Zapisywanie…' });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(button);

    await expect(button).toHaveFocus();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const MeasuredHeightAndTokens: Story = {
  name: 'Test: wysokość 36 px i kolory z tokenów',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Zapisz wpis' });

    const styles = getComputedStyle(button);

    await expect(button.getBoundingClientRect().height).toBe(CONTROL_HEIGHT_PX);
    await expect(styles.borderRadius).toBe('6px');
    await expect(styles.fontWeight).toBe('400');
    await expect(styles.boxShadow).toBe('none');
  },
};

export const HoverChangesOnlyEnabled: Story = {
  name: 'Test: zablokowany i ładowanie wyglądają inaczej niż aktywny',
  render: () => (
    <Row>
      <Button>Aktywny</Button>
      <Button disabled>Zablokowany</Button>
      <Button loading>Ładowanie</Button>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByRole('button', { name: 'Aktywny' });
    const disabled = canvas.getByRole('button', { name: 'Zablokowany' });
    const loading = canvas.getByRole('button', { name: 'Ładowanie' });
    const activeBackground = getComputedStyle(active).backgroundColor;

    await expect(getComputedStyle(disabled).backgroundColor).not.toBe(activeBackground);
    await expect(getComputedStyle(loading).backgroundColor).toBe(getComputedStyle(disabled).backgroundColor);
    await expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
  },
};

export const FocusRingUsesGlobalOutline: Story = {
  name: 'Test: fokus klawiaturą daje globalny obrys 2 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    const styles = getComputedStyle(canvas.getByRole('button', { name: 'Zapisz wpis' }));

    await expect(styles.outlineWidth).toBe('2px');
    await expect(styles.outlineOffset).toBe('2px');
  },
};
