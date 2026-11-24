import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell';

afterEach(cleanup);

const DISPLAY_NAME = 'Jan Kowalski';

describe('AppShell', () => {
  it('renders the product name, the signed-in name and the logout button in the banner and the content in main', () => {
    render(
      <AppShell displayName={DISPLAY_NAME} onLogout={vi.fn()}>
        <h1>Treść</h1>
      </AppShell>,
    );

    const banner = screen.getByRole('banner');
    const logout = screen.getByRole('button', { name: 'Wyloguj' });

    expect(banner.textContent).toContain('AITL');
    expect(banner.textContent).toContain(DISPLAY_NAME);
    expect(banner.contains(logout)).toBe(true);
    expect(logout.getAttribute('type')).toBe('button');
    expect(screen.getByRole('main').contains(screen.getByRole('heading', { name: 'Treść' }))).toBe(true);
  });

  it('renders the logout as a button, never as a link', () => {
    render(<AppShell onLogout={vi.fn()}>Treść</AppShell>);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: 'Wyloguj' }).className).toContain('underline');
  });

  it('calls onLogout when the logout button is clicked', () => {
    const onLogout = vi.fn();
    render(<AppShell onLogout={onLogout}>Treść</AppShell>);

    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders only the product name when there is no session', () => {
    render(<AppShell>Treść</AppShell>);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('banner').textContent).toBe('AITL');
  });

  it('renders the name without a logout button when there is no logout handler', () => {
    render(<AppShell displayName={DISPLAY_NAME}>Treść</AppShell>);

    expect(screen.getByRole('banner').textContent).toContain(DISPLAY_NAME);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders the logout button without a name when there is no display name', () => {
    render(<AppShell onLogout={vi.fn()}>Treść</AppShell>);

    expect(screen.getByRole('button', { name: 'Wyloguj' })).toBeTruthy();
    expect(document.querySelector('[data-slot="app-shell-user"]')).toBeNull();
  });

  it('gives the header and the content the same width limit', () => {
    render(<AppShell onLogout={vi.fn()}>Treść</AppShell>);

    const headerContainer = screen.getByRole('banner').firstElementChild;
    const main = screen.getByRole('main');

    expect(headerContainer?.className).toContain('max-w-240');
    expect(main.className).toContain('max-w-240');
  });

  it('lets the caller override the texts and add a class to the root', () => {
    const { container } = render(
      <AppShell onLogout={vi.fn()} messages={{ productName: 'Test', logoutLabel: 'Sign out' }} className="extra">
        Treść
      </AppShell>,
    );

    expect(screen.getByRole('banner').textContent).toContain('Test');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(container.firstElementChild?.className).toContain('extra');
  });
});
