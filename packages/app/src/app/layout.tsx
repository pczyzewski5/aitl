import type { ReactNode } from 'react';

export const metadata = {
  title: 'AITL',
  description: 'Śledzenie i analiza wydatków',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
