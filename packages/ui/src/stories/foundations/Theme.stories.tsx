import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeStatus } from '../../../.storybook/blocks/ThemeStatus';

const meta = {
  title: 'Fundamenty/Motyw',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Status: Story = { name: 'Stan motywów', render: () => <ThemeStatus /> };
