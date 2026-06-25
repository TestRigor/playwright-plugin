import type { LocatorType } from './LocatorType.js';

export class Locator {
  constructor(
    readonly type: LocatorType,
    readonly value: string,
  ) {}
}
