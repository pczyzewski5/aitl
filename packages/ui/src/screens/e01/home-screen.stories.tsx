import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BankAccountList } from '../../components/bank-accounts/bank-account-list';
import type { BankAccountListItem, BankAccountListProps } from '../../components/bank-accounts/bank-account-list';
import { TextLink } from '../../components/ui/text-link';

const NARROW_WIDTH_PX = 320;
const MOBILE_VIEWPORT = { value: 'mobile1', isRotated: false };
const TABLET_VIEWPORT = { value: 'tablet', isRotated: false };
const PRODUCT_NAME = 'AITL';
const LOGOUT_LABEL = 'Wyloguj';
const HEADER_LINK_CLASS = 'inline-flex min-h-control items-center text-primary-foreground hover:text-primary-foreground';

const SHARED_ACCOUNT: BankAccountListItem = { id: 'a1', name: 'Konto wspólne (przykład)', type: 'shared', href: '#konto-wspolne' };
const PERSONAL_ACCOUNT: BankAccountListItem = { id: 'a2', name: 'Konto osobiste Pawła (przykład)', type: 'personal', href: '#konto-osobiste' };
const LONG_NAME_ACCOUNT: BankAccountListItem = {
  id: 'a3',
  name: 'KontoWspólneRodzinyKowalskichNowakówNaWydatkiDomoweRachunkiIWakacje (przykład)',
  type: 'shared',
  href: '#konto-dlugie',
};

interface HomeScreenProps extends Pick<BankAccountListProps, 'status' | 'accounts' | 'retrying' | 'emptyAction'> {
  onRetry: () => void;
}

function HomeScreen({ status, accounts, retrying, emptyAction, onRetry }: HomeScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest('a')) {
          event.preventDefault();
        }
      }}
    >
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-240 items-center justify-between gap-(--space-within-group) p-(--space-panel)">
          <p className="min-w-0 text-xl font-semibold leading-base">{PRODUCT_NAME}</p>
          <TextLink href="#wyloguj" className={HEADER_LINK_CLASS}>
            {LOGOUT_LABEL}
          </TextLink>
        </div>
      </header>
      <main className="mx-auto w-full max-w-240 flex-1 px-(--space-panel) py-(--space-section)">
        <BankAccountList
          status={status}
          accounts={accounts}
          retrying={retrying}
          emptyAction={emptyAction}
          onRetry={onRetry}
          headingLevel="h1"
        />
      </main>
    </div>
  );
}

const meta = {
  title: 'Ekrany/E01 Dostęp i logowanie/Strona główna (/)',
  component: HomeScreen,
  parameters: { layout: 'fullscreen' },
  args: { status: 'loaded', accounts: [SHARED_ACCOUNT, PERSONAL_ACCOUNT], onRetry: fn() },
  argTypes: { status: { control: 'inline-radio', options: ['loading', 'error', 'loaded'] } },
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  name: 'Stan: wczytane konta (wspólne i osobiste)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('banner')).toHaveTextContent(PRODUCT_NAME);
    await expect(within(canvas.getByRole('banner')).getByRole('link', { name: LOGOUT_LABEL })).toBeVisible();
    await expect(canvas.getByRole('main')).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 1, name: 'Twoje konta bankowe' })).toBeVisible();
    await expect(within(canvas.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
    await expect(canvas.queryByRole('contentinfo')).toBeNull();
  },
};

export const SharedOnlyMember: Story = {
  name: 'Stan: członek tylko konta wspólnego (jedno konto)',
  args: { accounts: [SHARED_ACCOUNT] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('listitem')).toHaveLength(1);
    await expect(canvas.queryByText('Osobiste')).toBeNull();
  },
};

export const Loading: Story = {
  name: 'Stan: ładowanie',
  args: { status: 'loading', accounts: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('region', { name: 'Twoje konta bankowe' })).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('heading', { level: 1, name: 'Twoje konta bankowe' })).toBeVisible();
  },
};

export const Empty: Story = {
  name: 'Stan: brak kont',
  args: { accounts: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 2, name: 'Nie masz jeszcze żadnego konta bankowego' })).toBeVisible();
    await expect(canvas.queryByRole('list')).toBeNull();
  },
};

export const ErrorState: Story = {
  name: 'Stan: błąd wczytania',
  args: { status: 'error', accounts: undefined },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent('Nie udało się wczytać kont bankowych');
    await userEvent.click(canvas.getByRole('button', { name: 'Spróbuj ponownie' }));

    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const Tablet: Story = {
  name: 'Szerokość: 768 px',
  globals: { viewport: TABLET_VIEWPORT },
};

export const NarrowScreenLongName: Story = {
  name: 'Szerokość: 320 px, długa nazwa konta',
  globals: { viewport: MOBILE_VIEWPORT },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: { accounts: [LONG_NAME_ACCOUNT, PERSONAL_ACCOUNT] },
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
  },
};

export const HeaderLinkOnPrimary: Story = {
  name: 'Test: link "Wyloguj" na pasku --primary ma kolor --primary-foreground i cel co najmniej 24 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: LOGOUT_LABEL });

    const styles = getComputedStyle(link);

    await expect(styles.color).toBe(getComputedStyle(canvas.getByText(PRODUCT_NAME)).color);
    await expect(styles.textDecorationLine).toBe('underline');
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  },
};

export const FocusOrder: Story = {
  name: 'Test: kolejność fokusu (Wyloguj, potem konta w kolejności z API)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: LOGOUT_LABEL })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Konto wspólne (przykład)' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Konto osobiste Pawła (przykład)' })).toHaveFocus();
  },
};
