import { AsyncLocalStorage } from 'node:async_hooks';

const testIdStorage = new AsyncLocalStorage<string | undefined>();

export class TestRigorContext {
  private constructor() {}

  static setTestContext(testId: string | null | undefined): void {
    setIfPresent(testId);
  }

  static clearTestContext(): void {
    testIdStorage.enterWith(undefined);
  }

  static getTestId(): string | undefined {
    return testIdStorage.getStore();
  }
}

function setIfPresent(value: string | null | undefined): void {
  if (value == null || value.trim() === '') {
    testIdStorage.enterWith(undefined);
    return;
  }
  testIdStorage.enterWith(value);
}
