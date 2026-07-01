import { chromium, type Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runAsyncScriptInFrame, runSyncScriptInFrame } from './remote-script-adapter.js';

describe('remote-script-adapter', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('runSyncScriptInFrame exposes remote arguments array', async () => {
    const page = await browser.newPage();
    try {
      const handle = await runSyncScriptInFrame(page.mainFrame(), 'return arguments[0];', ['ok']);
      await expect(handle.jsonValue()).resolves.toBe('ok');
    } finally {
      await page.close();
    }
  });

  it('runAsyncScriptInFrame appends Promise callback', async () => {
    const page = await browser.newPage();
    try {
      const handle = await runAsyncScriptInFrame(
        page.mainFrame(),
        "const callback = arguments[arguments.length - 1]; callback('done');",
        [],
      );
      await expect(handle.jsonValue()).resolves.toBe('done');
    } finally {
      await page.close();
    }
  });
});
