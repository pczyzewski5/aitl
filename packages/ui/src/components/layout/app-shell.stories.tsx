import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AppShell } from './app-shell';

const NARROW_WIDTH_PX = 320;
const CONTENT_MAX_WIDTH_PX = 960;
const MIN_TARGET_SIZE_PX = 24;
const MOBILE_VIEWPORT = { value: 'mobile1', isRotated: false };
const LOGOUT_HREF = '#wyloguj';

function preventNavigationOnLink(event: MouseEvent<HTMLElement>): void {
  if ((event.target as HTMLElement).closest('a')) {
    event.preventDefault();
  }
}

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
  args: { logoutHref: LOGOUT_HREF, children: <SampleContent />, onClickCapture: fn(preventNavigationOnLink) },
  argTypes: { children: { control: false }, messages: { control: 'object' } },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithLogout: Story = {
  name: 'Po zalogowaniu: nazwa produktu i "Wyloguj"',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('banner')).toHaveTextContent('AITL');
    await expect(within(canvas.getByRole('banner')).getByRole('link', { name: 'Wyloguj' })).toBeVisible();
    await expect(canvas.getByRole('main')).toBeVisible();
    await expect(canvas.queryByRole('contentinfo')).toBeNull();
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

export const WithoutLogout: Story = {
  name: 'Przed zalogowaniem: tylko nazwa produktu (ekran logowania)',
  args: { logoutHref: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('banner')).toHaveTextContent('AITL');
    await expect(canvas.queryByRole('link')).toBeNull();
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

export const LogoutLinkOnPrimary: Story = {
  name: 'Test: "Wyloguj" ma kolor --primary-foreground, podkreślenie i cel co najmniej 24 px; fokus jest pierwszy',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Wyloguj' });

    const styles = getComputedStyle(link);

    await expect(styles.color).toBe(getComputedStyle(canvas.getByText('AITL')).color);
    await expect(styles.textDecorationLine).toBe('underline');
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(MIN_TARGET_SIZE_PX);
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};
