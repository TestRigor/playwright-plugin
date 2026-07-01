import type { ElementHandle, Locator } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import { ResolvedElement } from './resolved-element.js';

describe('ResolvedElement sendKeys', () => {
  it('type delegates to locator', async () => {
    const locator = {
      pressSequentially: vi.fn().mockResolvedValue(undefined),
    } as unknown as Locator;

    await ResolvedElement.fromLocator(locator).type('Playwright extension test');

    expect(locator.pressSequentially).toHaveBeenCalledWith('Playwright extension test');
  });

  it('type delegates to element handle', async () => {
    const handle = {
      focus: vi.fn().mockResolvedValue(undefined),
      ownerFrame: vi.fn().mockResolvedValue({
        page: vi.fn().mockReturnValue({
          keyboard: { type: vi.fn().mockResolvedValue(undefined) },
        }),
      }),
    } as unknown as ElementHandle;

    await ResolvedElement.fromHandle(handle).type('hello');

    const page = (await handle.ownerFrame())!.page();
    expect(page!.keyboard.type).toHaveBeenCalledWith('hello');
  });
});
