import { TestRigor } from '../../src/testrigor.js';
import type { TestrigorPlaywrightDriver } from '../../src/application/playwright-driver.js';
import { initManualTestConfig } from './manual-test-support.js';

export interface CreateManualDriverOptions {
  headless?: boolean;
  testContext?: string;
}

export async function createManualDriver(
  options: CreateManualDriverOptions = {},
): Promise<TestrigorPlaywrightDriver> {
  const { config, grpcEndpoint, apiToken } = initManualTestConfig();
  if (options.headless != null) {
    config['playwright.headless'] = options.headless;
  }
  const driver = await TestRigor.createBrowserPage(config, apiToken, grpcEndpoint);
  if (options.testContext != null && options.testContext.trim() !== '') {
    driver.setTestContext(options.testContext);
  }
  return driver;
}

export async function closeManualDriver(
  driver: TestrigorPlaywrightDriver | undefined,
): Promise<void> {
  if (driver == null) {
    return;
  }
  try {
    await driver.quit();
  } catch {
    // ignore cleanup errors
  }
}
