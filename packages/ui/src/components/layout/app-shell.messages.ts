interface AppShellMessages {
  productName: string;
  logoutLabel: string;
}

const DEFAULT_APP_SHELL_MESSAGES: AppShellMessages = {
  productName: 'AITL',
  logoutLabel: 'Wyloguj',
};

export { DEFAULT_APP_SHELL_MESSAGES };
export type { AppShellMessages };
