import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    docs: { toc: true },
  },
};

export default preview;
