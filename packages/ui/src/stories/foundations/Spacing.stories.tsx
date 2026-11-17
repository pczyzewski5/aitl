import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpacingRelations, SpacingScaleTable } from '../../../.storybook/blocks/SpacingScale';
import { SPACE_MEANINGS } from '../../../.storybook/blocks/token-catalog';
import { TokenTable } from '../../../.storybook/blocks/TokenTable';

const meta = {
  title: 'Fundamenty/Odstępy',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = { name: 'Skala', render: () => <SpacingScaleTable /> };

export const Meanings: Story = {
  name: 'Znaczenia (relacje)',
  render: () => <TokenTable caption="Odstępy według relacji" entries={SPACE_MEANINGS} />,
};

export const Relations: Story = { name: 'Relacje w praktyce', render: () => <SpacingRelations /> };
