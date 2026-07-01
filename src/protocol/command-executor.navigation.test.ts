import type { Browser, BrowserContext, Page } from 'playwright';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaywrightCommandExecutor } from './command-executor.js';
import { DriverCommandNames } from './driver-command-names.js';

const navigationCommands = [
  DriverCommandNames.GO_BACK,
  DriverCommandNames.BACK,
  DriverCommandNames.GO_FORWARD,
  DriverCommandNames.FORWARD,
  DriverCommandNames.REFRESH,
  DriverCommandNames.RELOAD,
] as const;

describe('PlaywrightCommandExecutor navigation', () => {
  let page: Page;
  let executor: PlaywrightCommandExecutor;

  beforeEach(() => {
    page = {
      goBack: vi.fn().mockResolvedValue(undefined),
      goForward: vi.fn().mockResolvedValue(undefined),
      reload: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      mainFrame: vi.fn(),
    } as unknown as Page;

    const context = {
      pages: vi.fn().mockReturnValue([page]),
    } as unknown as BrowserContext;

    const browser = {} as Browser;

    executor = new PlaywrightCommandExecutor('session-1', null, browser, context, page, null);
  });

  it.each(navigationCommands)(
    'execute supports remote navigation command %s',
    async (commandName) => {
      const response = await executor.execute(commandName, {});

      expect(response.status).toBe(0);
      expect(page.waitForLoadState).toHaveBeenCalledWith('domcontentloaded');
    },
  );

  it('execute goBack invokes Playwright goBack', async () => {
    await executor.execute(DriverCommandNames.GO_BACK, {});

    expect(page.goBack).toHaveBeenCalledWith({ waitUntil: 'load' });
  });

  it('execute goForward invokes Playwright goForward', async () => {
    await executor.execute(DriverCommandNames.GO_FORWARD, {});

    expect(page.goForward).toHaveBeenCalledWith({ waitUntil: 'load' });
  });

  it('execute reload invokes Playwright reload', async () => {
    await executor.execute(DriverCommandNames.RELOAD, {});

    expect(page.reload).toHaveBeenCalledWith({ waitUntil: 'load' });
  });

  it('execute refresh command invokes Playwright reload', async () => {
    await executor.execute(DriverCommandNames.REFRESH, {});

    expect(page.reload).toHaveBeenCalledWith({ waitUntil: 'load' });
  });
});
