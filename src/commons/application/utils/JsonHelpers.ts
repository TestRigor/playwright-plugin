import { TestRigorExtensionException } from '../../infrastructure/exceptions/TestRigorExtensionException.js';

export function serializeJson(value: unknown): string {
  if (value == null) {
    return '';
  }
  try {
    return JSON.stringify(value);
  } catch (e) {
    throw new TestRigorExtensionException('Failed to serialize value to JSON', { cause: e });
  }
}

export function deserializeJson<T>(json: string | null | undefined): T {
  const effectiveJson = json == null || json.trim() === '' ? '{}' : json;
  try {
    return JSON.parse(effectiveJson) as T;
  } catch (e) {
    throw new TestRigorExtensionException('Failed to deserialize JSON', { cause: e });
  }
}
