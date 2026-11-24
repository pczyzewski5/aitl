import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { LoadingMessage } from './loading-message';

const NARROW_WIDTH_PX = 320;
const NARROW_VIEWPORT = { value: 'mobile1', isRotated: false };
const LONG_MESSAGE =
  'Wczytywanie kont bankowych z https://example.com/bardzo/dlugi/adres/bez/spacji/w/komunikacie/ladowania/konta/wspolnego…';

const meta = {
  title: 'Elementy produktu/LoadingMessage',
  component: LoadingMessage,
  parameters: { layout: 'padded' },
  argTypes: { message: { control: 'text' } },
} satisfies Meta<typeof LoadingMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const DefaultText: Story = {
  name: 'Domyślny tekst: "Ładowanie…" jako status ogłaszany uprzejmie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');

    await expect(status).toHaveTextContent('Ładowanie…');
    await expect(status).toBeVisible();
  },
};

export const CustomText: Story = {
  name: 'Własny tekst opisujący, co się ładuje',
  args: { message: 'Wczytywanie kont…' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Wczytywanie kont…');
  },
};

export const LongTextNarrowScreen: Story = {
  name: 'Długi nieprzerwany tekst, 320 px',
  globals: { viewport: NARROW_VIEWPORT },
  args: { message: LONG_MESSAGE },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;

    await expect(frame.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
  },
};
