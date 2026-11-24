import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { formatMoneyMinor } from '../../lib/format-money-minor';
import { MonthPage } from '../e02/account-entries-screen.stories';

const NARROW_WIDTH_PX = 320;
const MOBILE_VIEWPORT = { value: 'mobile1', isRotated: false };
const TABLET_VIEWPORT = { value: 'tablet', isRotated: false };
const MINUS_SIGN = '−';
const PAGE_TITLE = 'Ile zostanie w miesiącu';
const RETRY_LABEL = 'Spróbuj ponownie';

function remainders(canvasElement: HTMLElement): string[] {
  return Array.from(canvasElement.querySelectorAll('[data-slot="account-remainder-value"]')).map((value) => value.textContent ?? '');
}

function addressOf(canvasElement: HTMLElement): string {
  return canvasElement.querySelector('[data-slot="demo-address"]')?.textContent ?? '';
}

const meta = {
  title: 'Ekrany/E03 Ile zostanie/Przegląd miesiąca (/?month=…)',
  component: MonthPage,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, iframeHeight: 720 } } },
  args: { onRetry: fn() },
  argTypes: {
    overview: {
      control: 'inline-radio',
      options: ['ready', 'loading', 'error', 'accounts-error', 'one-account', 'no-accounts'],
    },
    list: { control: 'inline-radio', options: ['ready', 'loading', 'error', 'limit'] },
    initialSearch: { control: 'text' },
    onRetry: { control: false },
  },
} satisfies Meta<typeof MonthPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TwoAccounts: Story = {
  name: 'Stan: dwa konta, osobne wyniki, wspólne wybrane',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 1, name: PAGE_TITLE })).toBeVisible();
    await expect(remainders(canvasElement)).toEqual([formatMoneyMinor(397900), formatMoneyMinor(104100)]);
    await expect(canvas.getByRole('button', { name: /Konto wspólne/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: /Konto osobiste/ })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const OneAccount: Story = {
  name: 'Stan: dostęp tylko do konta wspólnego (jedna karta)',
  args: { overview: 'one-account' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(remainders(canvasElement)).toHaveLength(1);
    await expect(canvas.queryByText('Konto osobiste')).toBeNull();
  },
};

export const NegativeRemainder: Story = {
  name: 'Stan: wynik ujemny na koncie wspólnym (wrzesień 2026)',
  args: { initialSearch: '?account=shared&month=2026-09' },
  play: async ({ canvasElement }) => {
    await expect(remainders(canvasElement)[0]).toBe(formatMoneyMinor(-60000));
  },
};

export const MonthWithoutEntries: Story = {
  name: 'Stan: miesiąc bez wpisów pokazuje zera na kartach, a lista pusty stan',
  args: { initialSearch: '?account=shared&month=2027-03' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(remainders(canvasElement)).toEqual([formatMoneyMinor(0), formatMoneyMinor(0)]);
    await expect(canvas.getByRole('heading', { name: 'W tym miesiącu nie ma jeszcze żadnych wpisów' })).toBeVisible();
  },
};

export const Loading: Story = {
  name: 'Stan: ładowanie wyników',
  args: { overview: 'loading' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByText('Wczytywanie wyniku konta')).toHaveLength(2);
    await expect(canvas.getByRole('heading', { level: 1, name: PAGE_TITLE })).toBeVisible();
  },
};

export const FailedToLoad: Story = {
  name: 'Stan: błąd wczytania wyników (lista wpisów działa niezależnie)',
  args: { overview: 'error' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('alert')).toHaveLength(2);
    await expect(canvas.getByRole('table')).toBeVisible();
    await userEvent.click(canvas.getAllByRole('button', { name: RETRY_LABEL })[0] as HTMLElement);

    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const AccountsFailedToLoad: Story = {
  name: 'Stan: błąd wczytania listy kont (nie ma kart ani wpisów)',
  args: { overview: 'accounts-error' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent('Nie udało się wczytać kont bankowych');
    await expect(canvas.queryByRole('table')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: RETRY_LABEL }));

    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const NoAccounts: Story = {
  name: 'Stan: brak kont (stan pusty zamiast kart i wpisów)',
  args: { overview: 'no-accounts' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 2, name: 'Nie masz dostępu do żadnego konta bankowego' })).toBeVisible();
    await expect(canvas.queryByRole('table')).toBeNull();
    await expect(canvas.queryByRole('button', { name: /Konto/ })).toBeNull();
  },
};

export const Tablet: Story = {
  name: 'Szerokość: 768 px',
  globals: { viewport: TABLET_VIEWPORT },
};

export const NarrowScreen: Story = {
  name: 'Szerokość: 320 px (karty jedna pod drugą)',
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { docs: { story: { inline: false, iframeHeight: 900 } } },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    const [first, second] = Array.from(canvasElement.querySelectorAll('[data-slot="account-remainder-card"]'));

    await expect(frame.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect((second as HTMLElement).getBoundingClientRect().top).toBeGreaterThan((first as HTMLElement).getBoundingClientRect().bottom - 1);
  },
};

export const MonthSwitchUpdatesAllCardsAndTheUrl: Story = {
  name: 'Test: zmiana miesiąca podmienia wyniki wszystkich kart naraz i zapisuje się w adresie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));

    await expect(remainders(canvasElement)).toEqual([formatMoneyMinor(459100), formatMoneyMinor(0)]);
    await expect(addressOf(canvasElement)).toBe('/?account=shared&month=2026-10');
  },
};

export const AccountSelectionIsInTheUrl: Story = {
  name: 'Test: wybór karty zaznacza ją, pokazuje wpisy tego konta i zapisuje konto w adresie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Konto osobiste/ }));

    await expect(canvas.getByRole('button', { name: /Konto osobiste/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('heading', { level: 2, name: 'Wpisy: Konto osobiste' })).toBeVisible();
    await expect(addressOf(canvasElement)).toBe('/?account=personal&month=2026-11');
  },
};

export const NegativeRemainderIsNotOnlyColour: Story = {
  ...NegativeRemainder,
  name: 'Test: wynik ujemny ma znak minus w tekście, nie tylko kolor',
  play: async ({ canvasElement }) => {
    const value = canvasElement.querySelector('[data-slot="account-remainder-value"]') as HTMLElement;

    await expect(value.textContent?.startsWith(MINUS_SIGN)).toBe(true);
  },
};
