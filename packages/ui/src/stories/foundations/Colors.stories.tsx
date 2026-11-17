import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContrastTable } from '../../../.storybook/blocks/ContrastTable';
import { COMPONENT_COLORS, MEANING_COLORS, RAW_COLORS } from '../../../.storybook/blocks/token-catalog';
import { swatch, TokenTable } from '../../../.storybook/blocks/TokenTable';

const meta = {
  title: 'Fundamenty/Kolory',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const RawColors: Story = {
  name: 'Warstwa 1: surowe wartości',
  render: () => <TokenTable caption="Warstwa 1: surowe wartości" entries={RAW_COLORS} preview={swatch} />,
};

export const MeaningColors: Story = {
  name: 'Warstwa 2: znaczenia',
  render: () => <TokenTable caption="Warstwa 2: znaczenia" entries={MEANING_COLORS} preview={swatch} />,
};

export const ComponentColors: Story = {
  name: 'Warstwa 3: tokeny komponentów',
  render: () => <TokenTable caption="Warstwa 3: tokeny komponentów" entries={COMPONENT_COLORS} preview={swatch} />,
};

export const TextContrast: Story = {
  name: 'Kontrast tekstu (próg 4,5:1)',
  render: () => <ContrastTable kind="text" caption="Kontrast tekstu: zatwierdzone pary, próg 4,5:1" />,
};

export const InterfaceContrast: Story = {
  name: 'Kontrast elementów interfejsu (próg 3:1)',
  render: () => <ContrastTable kind="ui" caption="Kontrast elementów interfejsu: zatwierdzone pary, próg 3:1" />,
};
