export enum LocatorType {
  XPATH = 'xpath',
  ID = 'id',
  CLASS = 'class',
  NAME = 'name',
  TAG_NAME = 'tag_name',
  CSS_SELECTOR = 'css_selector',
  LINK_TEXT = 'link_text',
  PARTIAL_LINK_TEXT = 'partial_link_text',
  USER_DESCRIPTION = 'user_description',
}

export function locatorTypeFromName(name: string): LocatorType {
  const byValue = Object.values(LocatorType).find((v) => v === name);
  if (byValue) {
    return byValue;
  }
  return LocatorType[name as keyof typeof LocatorType];
}
