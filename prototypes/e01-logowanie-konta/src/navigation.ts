import type { ScenarioState } from './store';

export const SCREEN_IDS = ['s01', 's02', 's03'] as const;
export type ScreenId = (typeof SCREEN_IDS)[number];

export const SCREEN_TITLES: Record<ScreenId, string> = {
  s01: 's01 Logowanie',
  s02: 's02 Lista kont',
  s03: 's03 Ekran konta (poza E01)',
};

export const NAVIGATE_EVENT = 'prototype:navigate';
export const SCREEN_CHANGE_EVENT = 'prototype:screen-change';

export function isScreenId(value: unknown): value is ScreenId {
  return SCREEN_IDS.some((screenId) => screenId === value);
}

export function resolveScreen(requested: ScreenId, state: ScenarioState): ScreenId {
  if (state.sessionUserId === null) {
    return 's01';
  }
  if (requested === 's01') {
    return 's02';
  }

  return requested;
}

export function navigateTo(screenId: ScreenId): void {
  document.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: screenId }));
}

function requestedScreenOf(target: EventTarget | null): ScreenId | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const hotspot = target.closest('[data-goto]');
  const link = target.closest('a[href^="#"]');
  const requested = hotspot?.getAttribute('data-goto') ?? link?.getAttribute('href')?.slice(1);

  return isScreenId(requested) ? requested : null;
}

export function installNavigationGate(readState: () => ScenarioState): () => void {
  const onClick = (event: MouseEvent): void => {
    const requested = requestedScreenOf(event.target);
    const inCommentMode = document.body.classList.contains('proto-comment');
    const inToolbar = event.target instanceof Element && event.target.closest('.doc-toolbar') !== null;
    if (requested === null || (inCommentMode && !inToolbar)) {
      return;
    }
    const resolved = resolveScreen(requested, readState());
    if (resolved !== requested) {
      event.preventDefault();
      event.stopPropagation();
      navigateTo(resolved);
    }
  };
  const onScreenChange = (event: Event): void => {
    const current = (event as CustomEvent<unknown>).detail;
    if (!isScreenId(current)) {
      return;
    }
    const resolved = resolveScreen(current, readState());
    if (resolved !== current) {
      navigateTo(resolved);
    }
  };

  window.addEventListener('click', onClick, true);
  document.addEventListener(SCREEN_CHANGE_EVENT, onScreenChange);

  return () => {
    window.removeEventListener('click', onClick, true);
    document.removeEventListener(SCREEN_CHANGE_EVENT, onScreenChange);
  };
}
