import { PlaywrightDriverException } from './playwright-driver-exception.js';

export class ShadowRootNotFoundException extends PlaywrightDriverException {
  constructor(message: string) {
    super(message);
    this.name = 'ShadowRootNotFoundException';
  }
}
