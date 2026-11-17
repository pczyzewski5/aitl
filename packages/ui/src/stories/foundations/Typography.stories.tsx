import type { Meta, StoryObj } from '@storybook/react-vite';
import { FONT_WEIGHTS } from '../../../.storybook/blocks/token-catalog';
import { TokenTable } from '../../../.storybook/blocks/TokenTable';
import { FontFamilySpecimen, FontSizeTable } from '../../../.storybook/blocks/TypeSpecimen';

const meta = {
  title: 'Fundamenty/Typografia',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Family: Story = { name: 'Czcionka', render: () => <FontFamilySpecimen /> };

export const Sizes: Story = { name: 'Rozmiary', render: () => <FontSizeTable /> };

export const Weights: Story = {
  name: 'Grubości',
  render: () => <TokenTable caption="Grubości czcionki" entries={FONT_WEIGHTS} />,
};
