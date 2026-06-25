import type { PlaywrightElementFinder } from '../locators/playwright-element-finder.js';
import { PlaywrightLocator } from '../locators/playwright-locator.js';
import type { ResolvedElement } from './resolved-element.js';

export class PlaywrightElement {
  constructor(
    private readonly resolved: ResolvedElement,
    private readonly finder: PlaywrightElementFinder,
  ) {}

  async click(): Promise<void> {
    await this.resolved.click();
  }

  async getText(): Promise<string> {
    return this.resolved.innerText();
  }

  async getAttribute(name: string): Promise<string | null> {
    return this.resolved.getAttribute(name);
  }

  async isDisplayed(): Promise<boolean> {
    return this.resolved.isVisible();
  }

  async isEnabled(): Promise<boolean> {
    return this.resolved.isEnabled();
  }

  async isSelected(): Promise<boolean> {
    return this.resolved.isSelected();
  }

  async findElement(locator: PlaywrightLocator): Promise<PlaywrightElement> {
    return this.finder.findElement(locator, this.resolved);
  }

  async findElements(locator: PlaywrightLocator): Promise<PlaywrightElement[]> {
    return this.finder.findElements(locator, this.resolved);
  }
}
