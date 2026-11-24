import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppShell } from './app-shell';

afterEach(cleanup);

describe('AppShell', () => {
  it('renders the product name in the banner, the logout link and the content in main', () => {
    render(
      <AppShell logoutHref="/logout">
        <h1>Treść</h1>
      </AppShell>,
    );

    const banner = screen.getByRole('banner');
    const logout = screen.getByRole('link', { name: 'Wyloguj' });

    expect(banner.textContent).toContain('AITL');
    expect(banner.contains(logout)).toBe(true);
    expect(logout.getAttribute('href')).toBe('/logout');
    expect(screen.getByRole('main').contains(screen.getByRole('heading', { name: 'Treść' }))).toBe(true);
  });

  it('renders no link when there is no logout target', () => {
    render(<AppShell>Treść</AppShell>);

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('gives the header and the content the same width limit', () => {
    render(<AppShell logoutHref="/logout">Treść</AppShell>);

    const headerContainer = screen.getByRole('banner').firstElementChild;
    const main = screen.getByRole('main');

    expect(headerContainer?.className).toContain('max-w-240');
    expect(main.className).toContain('max-w-240');
  });

  it('lets the caller override the texts and add a class to the root', () => {
    const { container } = render(
      <AppShell logoutHref="/logout" messages={{ productName: 'Test', logoutLabel: 'Sign out' }} className="extra">
        Treść
      </AppShell>,
    );

    expect(screen.getByRole('banner').textContent).toContain('Test');
    expect(screen.getByRole('link', { name: 'Sign out' })).toBeTruthy();
    expect(container.firstElementChild?.className).toContain('extra');
  });
});
