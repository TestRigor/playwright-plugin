export class PlaywrightDriverException extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'PlaywrightDriverException';
  }
}
