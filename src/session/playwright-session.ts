import type { Browser, BrowserContext, Page } from 'playwright';
import { randomUUID } from 'node:crypto';
import { PlaywrightCommandExecutor } from '../protocol/command-executor.js';
import { PlaywrightBrowserSession } from './playwright-browser-session.js';

export interface PlaywrightLaunchConfig {
  browser?: string;
  headless?: boolean;
}

export class PlaywrightSession {
  readonly page: Page;
  readonly browserSession: PlaywrightBrowserSession;
  private readonly ownsLifecycle: boolean;

  private constructor(
    page: Page,
    browserSession: PlaywrightBrowserSession,
    ownsLifecycle: boolean,
  ) {
    this.page = page;
    this.browserSession = browserSession;
    this.ownsLifecycle = ownsLifecycle;
  }

  static async launch(config: PlaywrightLaunchConfig = {}): Promise<PlaywrightSession> {
    const browserName = config.browser ?? 'chromium';
    const headless = config.headless ?? false;
    const browserType = await selectBrowserType(browserName);
    const browser = await browserType.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    return PlaywrightSession.wrapInternal(null, browser, context, page, true);
  }

  static wrap(page: Page): PlaywrightSession {
    const context = page.context();
    const browser = context.browser();
    return PlaywrightSession.wrapInternal(null, browser, context, page, false);
  }

  private static wrapInternal(
    playwright: { close(): Promise<void> } | null,
    browser: Browser | null,
    context: BrowserContext,
    page: Page,
    ownsLifecycle: boolean,
  ): PlaywrightSession {
    const sessionId = randomUUID();
    const executor = new PlaywrightCommandExecutor(
      sessionId,
      playwright,
      browser,
      context,
      page,
      ownsLifecycle
        ? (runnable) => {
            void runnable();
          }
        : null,
    );
    const browserSession = new PlaywrightBrowserSession(sessionId, executor);
    return new PlaywrightSession(page, browserSession, ownsLifecycle);
  }

  async close(): Promise<void> {
    if (!this.ownsLifecycle) {
      return;
    }
    try {
      await this.browserSession.executeCommand('quit', {});
    } catch (error) {
      console.warn(
        `Error closing Playwright session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

async function selectBrowserType(browserName: string) {
  const { chromium, firefox, webkit } = await import('playwright');
  switch (browserName.toLowerCase()) {
    case 'firefox':
      return firefox;
    case 'webkit':
      return webkit;
    case 'chromium':
    default:
      return chromium;
  }
}
