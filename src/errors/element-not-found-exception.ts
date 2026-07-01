import { PlaywrightDriverException } from './playwright-driver-exception.js';

export class ElementNotFoundException extends PlaywrightDriverException {
  constructor(message: string) {
    super(message);
    this.name = 'ElementNotFoundException';
  }
}
