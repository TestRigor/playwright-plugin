import { PlaywrightDriverException } from './playwright-driver-exception.js';

export class FrameNotFoundException extends PlaywrightDriverException {
  constructor(message: string) {
    super(message);
    this.name = 'FrameNotFoundException';
  }
}
