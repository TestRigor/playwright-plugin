export function readSendKeysText(parameters: Record<string, unknown>): string {
  const textParameter = parameters.text;
  if (textParameter != null) {
    return String(textParameter);
  }
  const rawValue = parameters.value;
  if (Array.isArray(rawValue)) {
    let builder = '';
    for (const item of rawValue) {
      if (item != null) {
        builder += item;
      }
    }
    return builder;
  }
  if (rawValue != null) {
    return String(rawValue);
  }
  return '';
}
