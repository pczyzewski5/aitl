import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles.css';

const THEME_ATTRIBUTE = 'data-theme';
const DEFAULT_THEME = 'light';

const withTheme: Decorator = (Story, context) => {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, context.globals.theme ?? DEFAULT_THEME);
  return Story();
};

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    docs: { toc: true },
  },
  globalTypes: {
    theme: {
      description: 'Motyw (atrybut data-theme na elemencie html)',
      toolbar: {
        title: 'Motyw',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Jasny' },
          { value: 'dark', title: 'Ciemny: brak wartości (L3), wygląda jak jasny' },
        ],
      },
    },
  },
  initialGlobals: { theme: DEFAULT_THEME },
  decorators: [withTheme],
};

export default preview;
