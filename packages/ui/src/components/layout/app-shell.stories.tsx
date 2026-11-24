import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AppShell } from './app-shell';

const NARROW_WIDTH_PX = 320;
const CONTENT_MAX_WIDTH_PX = 960;
const MIN_TARGET_SIZE_PX = 24;
const MOBILE_VIEWPORT = { value: 'mobile1', isRotated: false };
const DISPLAY_NAME = 'Jan Kowalski (przykład)';
const LONG_DISPLAY_NAME = 'Maria-Magdalena-Skłodowska-Kowalewska-Wiśniewska-Zawadzka-Przykładowa-Nazwiskowa';

function SampleContent() {
  return (
    <div className="flex flex-col gap-(--space-between-groups)">
      <h1 className="text-xl font-semibold leading-base">Treść strony (przykład)</h1>
      <Card>
        <CardHeader>
          <CardTitle as="h2">Sekcja (przykład)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Treść w kolumnie do 960 px, tak samo szeroka jak zawartość paska.</p>
        </CardContent>
      </Card>
    </div>
  );
}

const meta = {
  title: 'Elementy produktu/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: { displayName: DISPLAY_NAME, onLogout: fn(), children: <SampleContent /> },
  argTypes: { children: { control: false }, messages: { control: 'object' } },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithLogout: Story = {
  name: 'Po zalogowaniu: nazwa produktu, nazwa użytkownika i przycisk "Wyloguj"',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const banner = within(canvas.getByRole('banner'));

    await expect(canvas.getByRole('banner')).toHaveTextContent('AITL');
    await expect(canvas.getByRole('banner')).toHaveTextContent(DISPLAY_NAME);
    await expect(banner.queryByRole('link')).toBeNull();
    await expect(banner.getByRole('button', { name: 'Wyloguj' })).toBeVisible();
    await userEvent.click(banner.getByRole('button', { name: 'Wyloguj' }));
    await expect(args.onLogout).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('main')).toBeVisible();
    await expect(canvas.queryByRole('contentinfo')).toBeNull();
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

export const WithoutLogout: Story = {
  name: 'Przed zalogowaniem: tylko nazwa produktu (ekran logowania)',
  args: { displayName: undefined, onLogout: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('banner')).toHaveTextContent('AITL');
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const NarrowScreen: Story = {
  name: 'Szerokość: 320 px',
  globals: { viewport: MOBILE_VIEWPORT },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;

    await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
  },
};

export const LongDisplayNameNarrowScreen: Story = {
  name: 'Długa nazwa użytkownika, 320 px (zawija się, pasek nie przewija strony)',
  globals: { viewport: MOBILE_VIEWPORT },
  args: { displayName: LONG_DISPLAY_NAME },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvasElement.firstElementChild as HTMLElement;

    await expect(frame.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(canvas.getByRole('button', { name: 'Wyloguj' })).toBeVisible();
  },
};

export const ContentColumnMatchesTheHeader: Story = {
  name: 'Test: pasek i treść mają tę samą kolumnę do 960 px, wyrównaną do lewej krawędzi',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headerContainer = canvas.getByRole('banner').firstElementChild as HTMLElement;
    const main = canvas.getByRole('main');

    await expect(getComputedStyle(main).maxWidth).toBe(`${CONTENT_MAX_WIDTH_PX}px`);
    await expect(getComputedStyle(headerContainer).maxWidth).toBe(`${CONTENT_MAX_WIDTH_PX}px`);
    await expect(main.getBoundingClientRect().left).toBe(headerContainer.getBoundingClientRect().left);
    await expect(main.getBoundingClientRect().width).toBe(headerContainer.getBoundingClientRect().width);
  },
};

export const LogoutButtonLooksLikeALink: Story = {
  name: 'Test: "Wyloguj" to przycisk wyglądający jak link: kolor --primary-foreground, podkreślenie, cel co najmniej 24 px; fokus jest pierwszy',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Wyloguj' });

    const styles = getComputedStyle(button);

    await expect(styles.color).toBe(getComputedStyle(canvas.getByText('AITL')).color);
    await expect(styles.textDecorationLine).toBe('underline');
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(MIN_TARGET_SIZE_PX);
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};

export const LogoutWithKeyboard: Story = {
  name: 'Test: wylogowanie działa z klawiatury (Enter i spacja)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    await expect(canvas.getByRole('button', { name: 'Wyloguj' })).toHaveFocus();
    await expect(args.onLogout).toHaveBeenCalledTimes(2);
  },
};
