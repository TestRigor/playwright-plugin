export interface TestRigorCommandDriver {
  executePrompt(prompt: string): void | Promise<void>;
  grabValue(elementDescription: string): string | Promise<string>;
}
