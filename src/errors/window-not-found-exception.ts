import { PlaywrightDriverException } from './playwright-driver-exception.js';

export class WindowNotFoundException extends PlaywrightDriverException {
  constructor(message: string) {
    super(message);
    this.name = 'WindowNotFoundException';
  }
}
