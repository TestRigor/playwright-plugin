/**
 * Escapes user-supplied strings for testRigor prompt lines.
 * Double-quoted segments in testRigor use backslash to escape " and \.
 */
export function quoted(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Wraps the value in double quotes after escaping. E.g. Login -> "Login". */
export function quotedSegment(value: string | null | undefined): string {
  return `"${quoted(value)}"`;
}
