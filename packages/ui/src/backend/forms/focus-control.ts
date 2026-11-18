const FOCUSABLE_SELECTOR = 'input, select, textarea, button';
const TABBABLE_SELECTOR = '[tabindex="0"]';

function focusControl(element: HTMLElement | null): void {
  if (element === null) {
    return;
  }

  const target = element.matches(FOCUSABLE_SELECTOR)
    ? element
    : (element.querySelector<HTMLElement>(TABBABLE_SELECTOR) ?? element.querySelector<HTMLElement>(FOCUSABLE_SELECTOR));

  target?.focus();
}

export { focusControl };
