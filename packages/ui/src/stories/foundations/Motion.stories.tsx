import type { Meta, StoryObj } from '@storybook/react-vite';
import { MotionDemo } from '../../../.storybook/blocks/MotionDemo';
import { MOTION_TOKENS } from '../../../.storybook/blocks/token-catalog';
import { TokenTable } from '../../../.storybook/blocks/TokenTable';

const meta = {
  title: 'Fundamenty/Ruch',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  name: 'Token',
  render: () => <TokenTable caption="Ruch" entries={MOTION_TOKENS} />,
};

export const Hover: Story = { name: 'Hover przycisku głównego', render: () => <MotionDemo /> };
