import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShapeDemo } from '../../../.storybook/blocks/ShapeDemo';
import { SHAPE_TOKENS } from '../../../.storybook/blocks/token-catalog';
import { TokenTable } from '../../../.storybook/blocks/TokenTable';

const meta = {
  title: 'Fundamenty/Promienie i powierzchnie',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  name: 'Tokeny',
  render: () => <TokenTable caption="Promienie i cień" entries={SHAPE_TOKENS} />,
};

export const Surfaces: Story = { name: 'Powierzchnie z ramką', render: () => <ShapeDemo /> };
