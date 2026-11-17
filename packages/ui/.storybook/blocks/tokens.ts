import tokensCss from '../../src/tokens.css?raw';
import { parseCustomProperties, resolveProperty } from '../../src/design-tokens/token-css.ts';

const LIGHT_SELECTOR = ':root';
const DARK_SELECTOR = "[data-theme='dark']";

export const lightProperties = parseCustomProperties(tokensCss, LIGHT_SELECTOR);
export const darkProperties = parseCustomProperties(tokensCss, DARK_SELECTOR);
export { tokensCss };

export const reference = (name: string): string => lightProperties[name] ?? '';
export const resolved = (name: string): string => resolveProperty(lightProperties, name);
export const cssVar = (name: string): string => `var(${name})`;
