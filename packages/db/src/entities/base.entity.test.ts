import { describe, expect, it } from 'vitest';
import { baseEntityProperties } from './base.entity';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('baseEntityProperties', () => {
  it('generates a UUID primary key on create', () => {
    const options = baseEntityProperties.id['~options'];

    expect(options.primary).toBe(true);
    expect(options.onCreate()).toMatch(UUID_PATTERN);
  });

  it('sets createdAt to the current date on create', () => {
    const actual = baseEntityProperties.createdAt['~options'].onCreate();

    expect(actual).toBeInstanceOf(Date);
  });

  it('sets updatedAt on create and on update', () => {
    const options = baseEntityProperties.updatedAt['~options'];

    expect(options.onCreate()).toBeInstanceOf(Date);
    const onUpdate = options.onUpdate as () => Date;

    expect(onUpdate()).toBeInstanceOf(Date);
  });
});
