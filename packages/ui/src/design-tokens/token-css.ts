export type CustomProperties = Readonly<Record<string, string>>;

const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;
const VAR_REFERENCE = /^var\((--[\w-]+)\)$/;
const MAX_REFERENCE_DEPTH = 10;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseCustomProperties(css: string, selector: string): CustomProperties {
  const block = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`).exec(css);
  const properties: Record<string, string> = {};
  for (const [, name, value] of (block?.[1] ?? '').matchAll(DECLARATION)) {
    properties[name as string] = (value as string).trim();
  }
  return properties;
}

export function resolveProperty(properties: CustomProperties, name: string, depth = 0): string {
  const value = properties[name];
  if (value === undefined) {
    throw new Error(`Unknown token: ${name}`);
  }
  if (depth > MAX_REFERENCE_DEPTH) {
    throw new Error(`Token reference loop at: ${name}`);
  }
  const reference = VAR_REFERENCE.exec(value);
  return reference?.[1] ? resolveProperty(properties, reference[1], depth + 1) : value;
}
