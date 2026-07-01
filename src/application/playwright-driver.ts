import type { Page } from 'playwright';
import type { TestRigorCommandDriver } from '../commons/application/commands/TestRigorCommandDriver.js';
import { PlaywrightElement } from '../elements/playwright-element.js';
import { PlaywrightElementFinder } from '../locators/playwright-element-finder.js';
import { PlaywrightLocator } from '../locators/playwright-locator.js';
import type { PlaywrightSession } from '../session/playwright-session.js';
import type { PlaywrightExtensionService } from './extension-service.js';

export class TestrigorPlaywrightDriver implements TestRigorCommandDriver {
  private readonly playwrightSession: PlaywrightSession;
  private readonly extensionService: PlaywrightExtensionService;
  private readonly elementFinder: PlaywrightElementFinder;

  constructor(session: PlaywrightSession, extensionService: PlaywrightExtensionService) {
    this.playwrightSession = session;
    this.extensionService = extensionService;
    this.elementFinder = new PlaywrightElementFinder(
      extensionService,
      session.browserSession.commandExecutor,
    );
  }

  getPage(): Page {
    return this.playwrightSession.page;
  }

  async get(url: string): Promise<void> {
    await this.getPage().goto(url);
  }

  getCurrentUrl(): string {
    return this.getPage().url();
  }

  async getTitle(): Promise<string> {
    return this.getPage().title();
  }

  async back(): Promise<void> {
    await this.getPage().goBack();
  }

  async forward(): Promise<void> {
    await this.getPage().goForward();
  }

  async reload(): Promise<void> {
    await this.getPage().reload();
  }

  async quit(): Promise<void> {
    await this.extensionService.closeConnection();
    await this.playwrightSession.close();
  }

  async close(): Promise<void> {
    await this.quit();
  }

  setTestContext(testId: string): void {
    this.extensionService.setTestContext(testId);
  }

  clearTestContext(): void {
    this.extensionService.clearTestContext();
  }

  async executePrompt(prompt: string): Promise<void> {
    await this.extensionService.executePrompt(prompt);
  }

  async executeAction(actionName: string, parameters: Record<string, unknown>): Promise<unknown> {
    return this.extensionService.executeAction(actionName, parameters);
  }

  async click(elementDescription: string): Promise<void> {
    await this.extensionService.click(elementDescription);
  }

  async checkPageContains(text: string): Promise<void> {
    await this.extensionService.checkPageContains(text);
  }

  async grabValue(elementDescription: string): Promise<string> {
    return this.extensionService.grabValue(elementDescription);
  }

  async findByUserDescription(description: string): Promise<PlaywrightElement> {
    return this.findElement(PlaywrightLocator.byUserDescription(description));
  }

  async findElement(locator: PlaywrightLocator): Promise<PlaywrightElement> {
    return this.elementFinder.findElement(locator);
  }

  async findElements(locator: PlaywrightLocator): Promise<PlaywrightElement[]> {
    return this.elementFinder.findElements(locator);
  }
}
