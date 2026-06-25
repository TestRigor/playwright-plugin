import type { Frame, Locator } from 'playwright';

export function resolveFrame(frame: Frame, using: string, value: string): Locator {
  return frame.locator(toPlaywrightSelector(using, value));
}

export function resolveLocator(parent: Locator, using: string, value: string): Locator {
  return parent.locator(toPlaywrightSelector(using, value));
}

function toPlaywrightSelector(using: string, value: string): string {
  if (using == null || value == null) {
    throw new Error('Locator strategy and value are required');
  }
  switch (using) {
    case 'css selector':
      return value;
    case 'xpath':
      return `xpath=${value}`;
    case 'id':
      return `#${escapeCssId(value)}`;
    case 'name':
      return `[name='${escapeCssAttribute(value)}']`;
    case 'class name':
      return `.${escapeCssClass(value)}`;
    case 'tag name':
      return value;
    case 'link text':
      return `text="${escapePlaywrightText(value)}"`;
    case 'partial link text':
      return `text=${escapePlaywrightText(value)}`;
    default:
      throw new Error(`Unsupported locator strategy: ${using}`);
  }
}

/**
 * CSS-only selector for DOM APIs such as querySelector and shadow-root lookups.
 */
export function toCssSelector(using: string, value: string): string {
  if (using == null || value == null) {
    throw new Error('Locator strategy and value are required');
  }
  switch (using) {
    case 'css selector':
      return value;
    case 'id':
      return `#${escapeCssId(value)}`;
    case 'name':
      return `[name='${escapeCssAttribute(value)}']`;
    case 'class name':
      return `.${escapeCssClass(value)}`;
    case 'tag name':
      return value;
    case 'link text':
    case 'partial link text':
      throw new Error(`Link text is not supported in CSS selectors: ${using}`);
    case 'xpath':
      throw new Error('XPath must be evaluated separately from CSS selectors');
    default:
      throw new Error(`Unsupported locator strategy: ${using}`);
  }
}

export function escapeCssId(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
}

export function escapeCssAttribute(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeCssClass(value: string): string {
  return escapeCssId(value);
}

function escapePlaywrightText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
