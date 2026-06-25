import type { ElementHandle, Locator } from 'playwright';
import { ElementNotFoundException } from '../errors/element-not-found-exception.js';
import { ResolvedElement } from './resolved-element.js';

export class ElementRegistry {
  static readonly W3C_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
  private static readonly LEGACY_ELEMENT_KEY = 'ELEMENT';
  private static readonly ELEMENT_ID_PARAMETER = 'id';

  private counter = 0;
  private readonly elements = new Map<string, ResolvedElement>();

  register(locator: Locator): Record<string, string>;
  register(handle: ElementHandle): Record<string, string>;
  register(element: ResolvedElement): Record<string, string>;
  register(target: Locator | ElementHandle | ResolvedElement): Record<string, string> {
    if (target instanceof ResolvedElement) {
      return this.store(target);
    }
    if ('elementHandle' in target) {
      return this.store(ResolvedElement.fromLocator(target));
    }
    return this.store(ResolvedElement.fromHandle(target));
  }

  private store(element: ResolvedElement): Record<string, string> {
    const id = String(++this.counter);
    this.elements.set(id, element);
    return { [ElementRegistry.W3C_ELEMENT_KEY]: id };
  }

  resolve(parameters: Record<string, unknown>): ResolvedElement {
    const elementId = ElementRegistry.extractElementId(parameters);
    if (elementId == null) {
      throw new Error('Missing element reference');
    }
    const element = this.elements.get(elementId);
    if (element == null) {
      throw new ElementNotFoundException(`Element reference not found: ${elementId}`);
    }
    return element;
  }

  static extractElementId(parameters: Record<string, unknown> | null | undefined): string | null {
    if (parameters == null || Object.keys(parameters).length === 0) {
      return null;
    }
    const w3cId = parameters[ElementRegistry.W3C_ELEMENT_KEY];
    if (w3cId != null) {
      return String(w3cId);
    }
    const legacyId = parameters[ElementRegistry.LEGACY_ELEMENT_KEY];
    if (legacyId != null) {
      return String(legacyId);
    }
    const id = parameters[ElementRegistry.ELEMENT_ID_PARAMETER];
    if (id != null && typeof id === 'object' && !Array.isArray(id)) {
      return ElementRegistry.extractElementId(id as Record<string, unknown>);
    }
    if (id != null) {
      return String(id);
    }
    return null;
  }

  clear(): void {
    this.elements.clear();
  }
}
