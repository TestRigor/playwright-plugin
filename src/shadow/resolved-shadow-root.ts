import type { ElementHandle, JSHandle } from 'playwright';
import { ElementNotFoundException } from '../errors/element-not-found-exception.js';
import { ShadowRootNotFoundException } from '../errors/shadow-root-not-found-exception.js';
import { toCssSelector } from '../locators/playwright-locator-resolver.js';
import {
  hostShadowRoot,
  shadowRootFindAllByXpath,
  shadowRootFindByXpath,
  shadowRootQuerySelector,
  shadowRootQuerySelectorAll,
} from '../protocol/page-eval-functions.js';

export class ResolvedShadowRoot {
  constructor(private readonly shadowRoot: JSHandle) {}

  shadowRootHandle(): JSHandle {
    return this.shadowRoot;
  }

  static async fromHost(host: ElementHandle): Promise<ResolvedShadowRoot> {
    const handle = await hostShadowRoot(host);
    const value = await handle.evaluate((root) => root);
    if (value == null) {
      throw new ShadowRootNotFoundException('No shadow root attached to element');
    }
    return new ResolvedShadowRoot(handle);
  }

  async findElement(using: string, value: string): Promise<ElementHandle> {
    const result = await this.findHandle(using, value, false);
    const element = result.asElement();
    if (element == null) {
      throw new ElementNotFoundException('Unable to locate element in shadow root');
    }
    return element;
  }

  async findElements(using: string, value: string): Promise<ElementHandle[]> {
    const rawResult = await this.findRawResult(using, value, true);
    if (!Array.isArray(rawResult)) {
      return [];
    }
    const elements: ElementHandle[] = [];
    for (const handle of rawResult) {
      if (handle && typeof handle === 'object' && 'asElement' in handle) {
        const element = (handle as JSHandle).asElement();
        if (element != null) {
          elements.push(element);
        }
      }
    }
    return elements;
  }

  private async findHandle(using: string, value: string, multiple: boolean): Promise<JSHandle> {
    const rawResult = await this.findRawResult(using, value, multiple);
    if (rawResult == null) {
      throw new ElementNotFoundException('Unable to locate element in shadow root');
    }
    if (rawResult && typeof rawResult === 'object' && 'asElement' in rawResult) {
      return rawResult as JSHandle;
    }
    throw new ElementNotFoundException('Unable to locate element in shadow root');
  }

  private async findRawResult(using: string, value: string, multiple: boolean): Promise<unknown> {
    if (using === 'xpath') {
      if (multiple) {
        return this.extractElementHandlesFromArray(
          await shadowRootFindAllByXpath(this.shadowRoot, value),
        );
      }
      return shadowRootFindByXpath(this.shadowRoot, value);
    }
    const selector = toCssSelector(using, value);
    if (multiple) {
      return this.extractElementHandlesFromArray(
        await shadowRootQuerySelectorAll(this.shadowRoot, selector),
      );
    }
    return shadowRootQuerySelector(this.shadowRoot, selector);
  }

  private async extractElementHandlesFromArray(arrayHandle: JSHandle): Promise<JSHandle[]> {
    const properties = await arrayHandle.getProperties();
    const handles: JSHandle[] = [];
    for (const propertyHandle of properties.values()) {
      handles.push(propertyHandle);
    }
    await arrayHandle.dispose();
    return handles;
  }
}
