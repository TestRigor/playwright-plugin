import type { ActionType } from './ActionType.js';
import type { Locator } from './Locator.js';

export class Action {
  constructor(
    readonly type: ActionType,
    readonly locator: Locator,
  ) {}
}
