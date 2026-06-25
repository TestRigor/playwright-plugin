import type { Browser, BrowserContext, Page } from 'playwright';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaywrightCommandExecutor } from './command-executor.js';
import { DriverCommandNames } from './driver-command-names.js';

describe('PlaywrightCommandExecutor getCurrentUrl', () => {
  let page: Page;
  let executor: PlaywrightCommandExecutor;

  beforeEach(() => {
    page = {
      url: vi.fn().mockReturnValue('http://r4d4.info/form-button-label'),
      mainFrame: vi.fn().mockReturnValue({
        url: vi.fn().mockReturnValue('http://r4d4.info/form-button-label'),
      }),
      on: vi.fn(),
    } as unknown as Page;

    const context = {
      pages: vi.fn().mockReturnValue([page]),
    } as unknown as BrowserContext;

    executor = new PlaywrightCommandExecutor('session-1', null, {} as Browser, context, page, null);
  });

  it('returns page url for getCurrentUrl', async () => {
    const response = await executor.execute(DriverCommandNames.GET_CURRENT_URL, {});

    expect(response.status).toBe(0);
    expect(response.value).toBe('http://r4d4.info/form-button-label');
  });

  it('supports getUrl alias', async () => {
    const response = await executor.execute('getUrl', {});

    expect(response.value).toBe('http://r4d4.info/form-button-label');
  });
});
