import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BankAccountList } from './bank-account-list';
import type { BankAccountListItem } from './bank-account-list';

const NARROW_WIDTH_PX = 320;
const MIN_TARGET_PX = 24;
const MANY_ACCOUNTS_COUNT = 8;
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 360 } };

const SHARED_ACCOUNT: BankAccountListItem = { id: 'a1', name: 'Konto wspólne (przykład)', type: 'shared', href: '#konto-wspolne' };
const PERSONAL_ACCOUNT: BankAccountListItem = { id: 'a2', name: 'Konto osobiste Pawła (przykład)', type: 'personal', href: '#konto-osobiste' };
const LONG_NAME_ACCOUNTS: BankAccountListItem[] = [
  {
    id: 'a3',
    name: 'Konto wspólne rodziny Kowalskich-Nowaków na wydatki domowe, rachunki i wakacje (przykład)',
    type: 'shared',
    href: '#dlugie-1',
  },
  {
    id: 'a4',
    name: 'KontoOsobisteZBardzoDlugąNazwąBezSpacjiKtóraNieMieściSięWJednejLinijceNaWąskimEkranie (przykład)',
    type: 'personal',
    href: '#dlugie-2',
  },
];

function accountsOfCount(count: number): BankAccountListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `many-${index}`,
    name: `Konto numer ${index + 1} (przykład)`,
    type: index % 2 === 0 ? 'shared' : 'personal',
    href: `#konto-${index}`,
  }));
}

function preventNavigation(event: { target: EventTarget; preventDefault: () => void }) {
  if ((event.target as HTMLElement).closest('a')) {
    event.preventDefault();
  }
}

const meta = {
  title: 'Elementy produktu/E01/BankAccountList',
  component: BankAccountList,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-xl" onClickCapture={preventNavigation}>
        <Story />
      </div>
    ),
  ],
  args: {
    status: 'loaded',
    accounts: [SHARED_ACCOUNT, PERSONAL_ACCOUNT],
    onRetry: fn(),
  },
  argTypes: {
    status: { control: 'inline-radio', options: ['loading', 'error', 'loaded'] },
    headingLevel: { control: 'inline-radio', options: ['h1', 'h2'] },
    accounts: { control: 'object' },
  },
} satisfies Meta<typeof BankAccountList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { parameters: { docs: DOCS_IFRAME } };

export const Loaded: Story = {
  name: 'Wczytane: konto wspólne i osobiste (kolejność jak z API)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const list = canvas.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    await expect(items).toHaveLength(2);
    await expect(within(items[0] as HTMLElement).getByRole('link', { name: 'Konto wspólne (przykład)' })).toBeVisible();
    await expect(within(items[0] as HTMLElement).getByText('Wspólne')).toBeVisible();
    await expect(within(items[1] as HTMLElement).getByRole('link', { name: 'Konto osobiste Pawła (przykład)' })).toBeVisible();
    await expect(within(items[1] as HTMLElement).getByText('Osobiste')).toBeVisible();
    await expect(canvas.getByRole('region', { name: 'Twoje konta bankowe' })).not.toHaveAttribute('aria-busy');
  },
};

export const PersonalFirstKeepsReceivedOrder: Story = {
  name: 'Kolejność z API bez sortowania (osobiste przed wspólnym)',
  args: { accounts: [PERSONAL_ACCOUNT, SHARED_ACCOUNT] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const names = canvas.getAllByRole('link').map((link) => link.textContent);

    await expect(names).toEqual(['Konto osobiste Pawła (przykład)', 'Konto wspólne (przykład)']);
  },
};

export const SharedOnlyMember: Story = {
  name: 'Członek tylko konta wspólnego (E01-S02): jedno konto, bez śladu konta osobistego',
  args: { accounts: [SHARED_ACCOUNT] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('listitem')).toHaveLength(1);
    await expect(canvas.getByText('Wspólne')).toBeVisible();
    await expect(canvas.queryByText('Osobiste')).toBeNull();
    await expect(canvas.queryByText(/osobist/i)).toBeNull();
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

export const Loading: Story = {
  name: 'Ładowanie: szkielet w kontenerze z aria-busy',
  args: { status: 'loading', accounts: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const region = canvas.getByRole('region', { name: 'Twoje konta bankowe' });

    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(region.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvas.queryByRole('link')).toBeNull();
  },
};

export const Empty: Story = {
  name: 'Pusto: brak kont, z wyjaśnieniem i bez przycisku',
  args: { accounts: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 3, name: 'Nie masz jeszcze żadnego konta bankowego' })).toBeVisible();
    await expect(canvas.getByText('Skontaktuj się z administratorem aplikacji.')).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.queryByRole('list')).toBeNull();
  },
};

export const EmptyWithAction: Story = {
  name: 'Pusto z opcjonalną akcją "Sprawdź ponownie"',
  args: { accounts: [], emptyAction: { label: 'Sprawdź ponownie', onClick: fn() } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Sprawdź ponownie' }));

    await expect(args.emptyAction?.onClick).toHaveBeenCalledTimes(1);
  },
};

export const ErrorState: Story = {
  name: 'Błąd wczytania: ponów próbę',
  args: { status: 'error', accounts: undefined },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent('Nie udało się wczytać kont bankowych');
    await userEvent.click(canvas.getByRole('button', { name: 'Spróbuj ponownie' }));

    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const ErrorRetrying: Story = {
  name: 'Błąd wczytania: ponowna próba trwa (przycisk zajęty)',
  args: { status: 'error', accounts: undefined, retrying: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Spróbuj ponownie' })).toHaveAttribute('aria-busy', 'true');
  },
};

export const ManyAccounts: Story = {
  name: 'Dużo danych: osiem kont',
  args: { accounts: accountsOfCount(MANY_ACCOUNTS_COUNT) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('listitem')).toHaveLength(MANY_ACCOUNTS_COUNT);
  },
};

export const LongNamesNarrowScreen: Story = {
  name: 'Długie nazwy, wąski ekran (320 px)',
  args: { accounts: LONG_NAME_ACCOUNTS },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-slot="bank-account-list"]') as HTMLElement;

    await expect(section.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(section.scrollWidth).toBeLessThanOrEqual(section.clientWidth);
    for (const item of canvasElement.querySelectorAll<HTMLElement>('[data-slot="bank-account-list-item"]')) {
      await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
    }
  },
};

export const LinkTargetIsLargeEnough: Story = {
  name: 'Test: link konta ma cel co najmniej 24 px i działa z klawiatury',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first] = canvas.getAllByRole('link');

    await userEvent.tab();

    await expect(first).toHaveFocus();
    await expect(first?.getBoundingClientRect().height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    await expect(first).toHaveAttribute('href', '#konto-wspolne');
  },
};

export const BadgeNamesTheTypeInText: Story = {
  name: 'Test: typ konta jest w tekście plakietki, nie tylko w kolorze',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Wspólne')).toHaveAttribute('data-variant', 'shared');
    await expect(canvas.getByText('Osobiste')).toHaveAttribute('data-variant', 'personal');
  },
};

interface ExampleProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function Example({ verdict, explanation, children }: ExampleProps) {
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-2 rounded-card border border-border bg-background p-4">
      <p className="font-semibold">{verdict}</p>
      <div>{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  parameters: { docs: DOCS_IFRAME },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Członek tylko konta wspólnego widzi jedno konto, bez śladu, że istnieje konto osobiste kogoś innego.">
          <BankAccountList {...args} headingLevel="h2" accounts={[SHARED_ACCOUNT]} />
        </Example>
        <Example verdict="Źle" explanation="Podpowiedź o ukrytym koncie zdradza jego istnienie i myli: nie ma tu nic do zrobienia.">
          <p className="text-sm">Konto osobiste jest niedostępne dla Twojego użytkownika.</p>
        </Example>
      </div>
    </div>
  ),
};
