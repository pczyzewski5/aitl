import { useRef } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestHeadingFocus, useRequestedHeadingFocus } from './heading-focus';

function Probe({ withHeading = true }: { withHeading?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  useRequestedHeadingFocus(container);

  return <div ref={container}>{withHeading ? <h1>Tytul</h1> : <p>Tekst</p>}</div>;
}

describe('useRequestedHeadingFocus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('focuses the h1 after the timer when a focus was requested', () => {
    requestHeadingFocus();
    const { container } = render(<Probe />);

    act(() => {
      vi.runAllTimers();
    });

    const heading = container.querySelector('h1');
    expect(document.activeElement).toBe(heading);
    expect(heading?.getAttribute('tabindex')).toBe('-1');
  });

  it('does not focus anything without a request', () => {
    const { container } = render(<Probe />);

    act(() => {
      vi.runAllTimers();
    });

    expect(document.activeElement).toBe(document.body);
    expect(container.querySelector('h1')?.hasAttribute('tabindex')).toBe(false);
  });

  it('consumes the request so the next mount does not focus', () => {
    requestHeadingFocus();
    const first = render(<Probe />);
    act(() => {
      vi.runAllTimers();
    });
    first.unmount();

    const second = render(<Probe />);
    act(() => {
      vi.runAllTimers();
    });

    expect(document.activeElement).toBe(document.body);
    expect(second.container.querySelector('h1')?.hasAttribute('tabindex')).toBe(false);
  });

  it('keeps the request when unmounted before the timer fires', () => {
    requestHeadingFocus();
    const first = render(<Probe />);
    first.unmount();
    act(() => {
      vi.runAllTimers();
    });

    const second = render(<Probe />);
    act(() => {
      vi.runAllTimers();
    });

    expect(document.activeElement).toBe(second.container.querySelector('h1'));
  });

  it('does nothing when the container has no heading', () => {
    requestHeadingFocus();
    render(<Probe withHeading={false} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(document.activeElement).toBe(document.body);
  });
});
