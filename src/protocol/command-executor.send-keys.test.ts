import { describe, expect, it } from 'vitest';
import { readSendKeysText } from './send-keys-text.js';

describe('readSendKeysText', () => {
  it('uses text parameter for W3C payload', () => {
    expect(readSendKeysText({ text: 'hello' })).toBe('hello');
  });

  it('joins value list from wire protocol', () => {
    expect(readSendKeysText({ value: ['Playwright extension test'] })).toBe(
      'Playwright extension test',
    );
    expect(readSendKeysText({ value: ['Play', 'wright'] })).toBe('Playwright');
  });
});
