import { useEffect } from 'react';
import type { RefObject } from 'react';

const HEADING_SELECTOR = 'h1';
const FOCUSABLE_TAB_INDEX = '-1';
const DEFER_MS = 0;

let focusRequested = false;

export function requestHeadingFocus(): void {
  focusRequested = true;
}

export function useRequestedHeadingFocus(container: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!focusRequested) {
        return;
      }

      focusRequested = false;
      const heading = container.current?.querySelector<HTMLElement>(HEADING_SELECTOR);
      heading?.setAttribute('tabindex', FOCUSABLE_TAB_INDEX);
      heading?.focus();
    }, DEFER_MS);

    return () => window.clearTimeout(timer);
  }, [container]);
}
