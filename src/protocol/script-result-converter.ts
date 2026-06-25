import type { JSHandle } from 'playwright';
import { ElementRegistry } from '../elements/element-registry.js';

export class PlaywrightScriptResultConverter {
  constructor(private readonly elementRegistry: ElementRegistry) {}

  async convert(handle: JSHandle | null): Promise<unknown> {
    if (handle == null) {
      return null;
    }
    const elementHandle = handle.asElement();
    if (elementHandle != null) {
      return this.elementRegistry.register(elementHandle);
    }
    return this.convertValue(await handle.jsonValue());
  }

  convertValue(value: unknown): unknown {
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      const map = value as Record<string, unknown>;
      const converted: Record<string, unknown> = {};
      for (const [key, entryValue] of Object.entries(map)) {
        converted[key] = this.convertValue(entryValue);
      }
      return converted;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.convertValue(item));
    }
    return value;
  }
}
