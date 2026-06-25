import type { ElementHandle, Locator } from 'playwright';
import { ElementNotFoundException } from '../errors/element-not-found-exception.js';
import { resolveLocator, toCssSelector } from '../locators/playwright-locator-resolver.js';
import {
  findChildByXpath,
  isElementSelected,
  readElementProperty,
} from '../protocol/page-eval-functions.js';

export class ResolvedElement {
  private readonly locator: Locator | null;
  private readonly handle: ElementHandle | null;

  private constructor(locator: Locator | null, handle: ElementHandle | null) {
    this.locator = locator;
    this.handle = handle;
  }

  static fromLocator(locator: Locator): ResolvedElement {
    return new ResolvedElement(locator, null);
  }

  static fromHandle(handle: ElementHandle): ResolvedElement {
    return new ResolvedElement(null, handle);
  }

  toLocator(): Locator {
    if (this.locator != null) {
      return this.locator;
    }
    throw new ElementNotFoundException('Element handle cannot be used as a locator');
  }

  async toElementHandle(): Promise<ElementHandle> {
    if (this.handle != null) {
      return this.handle;
    }
    const elementHandle = await this.locator!.elementHandle();
    if (elementHandle == null) {
      throw new ElementNotFoundException('Unable to resolve element handle');
    }
    return elementHandle;
  }

  async click(): Promise<void> {
    if (this.locator != null) {
      await this.locator.click();
      return;
    }
    await this.handle!.click();
  }

  async fill(value: string): Promise<void> {
    if (this.locator != null) {
      await this.locator.fill(value);
      return;
    }
    await this.handle!.fill(value);
  }

  async press(keys: string): Promise<void> {
    if (this.locator != null) {
      await this.locator.press(keys);
      return;
    }
    await this.handle!.press(keys);
  }

  async type(text: string): Promise<void> {
    if (this.locator != null) {
      await this.locator.pressSequentially(text);
      return;
    }
    await this.handle!.focus();
    const ownerFrame = await this.handle!.ownerFrame();
    const page = ownerFrame?.page();
    if (page == null) {
      throw new ElementNotFoundException('Unable to resolve element handle');
    }
    await page.keyboard.type(text);
  }

  async innerText(): Promise<string> {
    if (this.locator != null) {
      return this.locator.innerText();
    }
    return this.handle!.innerText();
  }

  async getAttribute(name: string): Promise<string | null> {
    const attribute =
      this.locator != null
        ? await this.locator.getAttribute(name)
        : await this.handle!.getAttribute(name);
    if (attribute != null) {
      return attribute;
    }
    return this.readDomProperty(name);
  }

  async readDomProperty(name: string): Promise<string | null> {
    const handle = await this.toElementHandle();
    const value = await readElementProperty(handle, name);
    return value == null ? null : String(value);
  }

  async isVisible(): Promise<boolean> {
    if (this.locator != null) {
      return this.locator.isVisible();
    }
    return this.handle!.isVisible();
  }

  async isEnabled(): Promise<boolean> {
    if (this.locator != null) {
      return this.locator.isEnabled();
    }
    return this.handle!.isEnabled();
  }

  async isSelected(): Promise<boolean> {
    const handle = await this.toElementHandle();
    return isElementSelected(handle);
  }

  async boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    if (this.locator != null) {
      return this.locator.boundingBox();
    }
    return this.handle!.boundingBox();
  }

  async findChild(using: string, value: string): Promise<ResolvedElement> {
    if (this.locator != null) {
      const child = resolveLocator(this.locator, using, value);
      if ((await child.count()) === 0) {
        throw new ElementNotFoundException('Unable to locate child element');
      }
      return ResolvedElement.fromLocator(child.first());
    }
    if (using === 'xpath') {
      const handle = await this.toElementHandle();
      const childHandle = await findChildByXpath(handle, value);
      if (childHandle == null) {
        throw new ElementNotFoundException('Unable to locate child element');
      }
      return ResolvedElement.fromHandle(childHandle);
    }
    const selector = toCssSelector(using, value);
    const childHandle = await this.handle!.$(selector);
    if (childHandle == null) {
      throw new ElementNotFoundException('Unable to locate child element');
    }
    return ResolvedElement.fromHandle(childHandle);
  }
}
