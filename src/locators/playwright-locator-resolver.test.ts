import type { Frame } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import { resolveFrame, toCssSelector } from './playwright-locator-resolver.js';

function toPlaywrightSelector(using: string, value: string): string {
  const frame = { locator: vi.fn() };
  resolveFrame(frame as unknown as Frame, using, value);
  return frame.locator.mock.calls[0]![0] as string;
}

describe('PlaywrightLocatorResolver', () => {
  it('toPlaywrightSelector css returns value', () => {
    expect(toPlaywrightSelector('css selector', '.btn-primary')).toBe('.btn-primary');
  });

  it('toPlaywrightSelector xpath adds prefix', () => {
    expect(toPlaywrightSelector('xpath', '//button')).toBe('xpath=//button');
  });

  it('toPlaywrightSelector id escapes special characters', () => {
    expect(toPlaywrightSelector('id', 'item:42')).toBe('#item\\:42');
  });

  it('toPlaywrightSelector name builds attribute selector', () => {
    expect(toPlaywrightSelector('name', 'email')).toBe("[name='email']");
  });

  it('toPlaywrightSelector linkText uses exact match', () => {
    expect(toPlaywrightSelector('link text', 'Sign in')).toBe('text="Sign in"');
  });

  it('toPlaywrightSelector partialLinkText uses substring match', () => {
    expect(toPlaywrightSelector('partial link text', 'Sign')).toBe('text=Sign');
  });

  it('toCssSelector id builds hash selector', () => {
    expect(toCssSelector('id', 'login')).toBe('#login');
  });

  it('toCssSelector xpath is rejected', () => {
    expect(() => toCssSelector('xpath', '//button')).toThrow('XPath must be evaluated separately');
  });
});
