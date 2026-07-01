import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TestrigorPlaywrightDriver } from '../../src/application/playwright-driver.js';
import { PlaywrightLocator } from '../../src/locators/playwright-locator.js';
import { TestRigor } from '../../src/testrigor.js';
import { closeManualDriver, createManualDriver } from './manual-driver.js';

const R4D4_URL = 'http://r4d4.info/';
const LABEL_UPDATER_URL = 'http://r4d4.info/form-button-label';

describe.sequential('PlaywrightGrpcTest', () => {
  let driver: TestrigorPlaywrightDriver;

  beforeEach(async () => {
    driver = await createManualDriver();
  });

  afterEach(async () => {
    await closeManualDriver(driver);
  });

  function beginTest(testContext: string): void {
    driver.setTestContext(testContext);
  }

  async function openHome(): Promise<void> {
    await TestRigor.actions(driver).openUrl(R4D4_URL).waitUntilPageContains('Home Page').execute();
  }

  it('test_find_by_user_description', async () => {
    beginTest('test_find_by_user_description');
    await openHome();

    const button = await driver.findElement(TestRigor.byUserDescription('Empty Page'));
    expect(button).not.toBeNull();

    await TestRigor.validations(driver).checkThatElementIsVisible('Empty Page').execute();
  });

  it('test_home_page_validations', async () => {
    beginTest('test_home_page_validations');
    await openHome();

    await TestRigor.validations(driver)
      .checkPageContains('Home Page')
      .and()
      .checkPageContains('List of Sections and Shortcuts')
      .and()
      .checkUrlContains('r4d4.info')
      .execute();
  });

  it('test_navigation_flow_via_actions', async () => {
    beginTest('test_navigation_flow_via_actions');
    await openHome();

    await TestRigor.actions(driver)
      .click('Static Pages')
      .waitUntilPageContains('List of static pages')
      .goBack()
      .and()
      .click('Empty Page')
      .waitUntilPageContains('This is just an empty page')
      .execute();
  });

  it('test_local_playwright_locators', async () => {
    beginTest('test_local_playwright_locators');

    await TestRigor.actions(driver)
      .openUrl(LABEL_UPDATER_URL)
      .waitUntilPageContains('Label Updater')
      .execute();

    const updateButton = await driver.findElement(PlaywrightLocator.id('changer'));
    expect(await updateButton.isDisplayed()).toBe(true);

    await TestRigor.validations(driver)
      .checkButtonEnabled('Update Message')
      .and()
      .checkThatElementIsEnabled('Message')
      .and()
      .checkThatElementContains('Update Message', 'Update Message')
      .execute();
  });

  it('test_label_updater_via_testrigor_commands', async () => {
    beginTest('test_label_updater_via_testrigor_commands');
    const message = 'Playwright extension test';

    await TestRigor.actions(driver)
      .openUrl(LABEL_UPDATER_URL)
      .waitUntilPageContains('Label Updater')
      .and()
      .enter(message)
      .into('Message')
      .and()
      .click('Update Message')
      .execute();

    await TestRigor.validations(driver)
      .checkPageContains(message)
      .and()
      .checkThatInputHasValue('Message', message)
      .execute();

    const grabbed = await TestRigor.queries(driver).grabValue('input', 'Message');
    expect(grabbed).toContain(message);
  });

  it('test_execute_prompt_checks', async () => {
    beginTest('test_execute_prompt_checks');

    await TestRigor.actions(driver)
      .openUrl(LABEL_UPDATER_URL)
      .waitUntilPageContains('Label Updater')
      .execute();

    await TestRigor.validations(driver)
      .checkPageContains('Label Updater')
      .and()
      .checkPageContains('Update Message')
      .and()
      .checkUrlContains('form-button-label')
      .execute();

    await driver.executePrompt('check that page contains "Updates this message"');
  });

  it('test_self_healing_locator', async () => {
    beginTest('test_self_healing_locator');

    await TestRigor.actions(driver)
      .openUrl(LABEL_UPDATER_URL)
      .waitUntilPageContains('Label Updater')
      .execute();

    const seeded = await driver.findElement(PlaywrightLocator.id('changer'));
    expect(await seeded.isDisplayed()).toBe(true);

    await driver.getPage().evaluate(() => {
      const button = document.getElementById('changer');
      if (button == null) {
        throw new Error('Expected #changer before DOM mutation');
      }
      button.id = 'changer-updated';
    });

    const healed = await driver.findElement(PlaywrightLocator.id('changer'));
    expect(await healed.isDisplayed()).toBe(true);
  });
});
