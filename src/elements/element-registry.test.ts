import type { ElementHandle, JSHandle, Locator } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import { ElementRegistry } from './element-registry.js';
import { PlaywrightScriptResultConverter } from '../protocol/script-result-converter.js';

describe('ElementRegistry', () => {
  it('resolve accepts legacy id parameter', () => {
    const registry = new ElementRegistry();
    const locator = { elementHandle: vi.fn() } as unknown as Locator;
    const id = String(registry.register(locator)[ElementRegistry.W3C_ELEMENT_KEY]);

    expect(registry.resolve({ id }).toLocator()).toBe(locator);
  });

  it('resolve accepts W3C element reference', () => {
    const registry = new ElementRegistry();
    const locator = { elementHandle: vi.fn() } as unknown as Locator;
    const registered = registry.register(locator);

    expect(registry.resolve(registered).toLocator()).toBe(locator);
  });

  it('resolve accepts nested parent reference', () => {
    const registry = new ElementRegistry();
    const locator = { elementHandle: vi.fn() } as unknown as Locator;
    const id = String(registry.register(locator)[ElementRegistry.W3C_ELEMENT_KEY]);

    const parameters = {
      id: { [ElementRegistry.W3C_ELEMENT_KEY]: id },
      using: 'css selector',
      value: '.child',
    };

    expect(registry.resolve(parameters).toLocator()).toBe(locator);
  });

  it('register elementHandle can be resolved', async () => {
    const registry = new ElementRegistry();
    const handle = {} as ElementHandle;
    const id = String(registry.register(handle)[ElementRegistry.W3C_ELEMENT_KEY]);

    await expect(registry.resolve({ id }).toElementHandle()).resolves.toBe(handle);
  });

  it('scriptResultConverter registers returned elements', async () => {
    const registry = new ElementRegistry();
    const converter = new PlaywrightScriptResultConverter(registry);
    const handle = {} as ElementHandle;
    const jsHandle = {
      asElement: vi.fn().mockReturnValue(handle),
    } as unknown as JSHandle;

    const reference = (await converter.convert(jsHandle)) as Record<string, string>;

    expect(reference).toHaveProperty(ElementRegistry.W3C_ELEMENT_KEY);
    await expect(registry.resolve(reference).toElementHandle()).resolves.toBe(handle);
  });
});
