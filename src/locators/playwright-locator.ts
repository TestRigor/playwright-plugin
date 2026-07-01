import { Locator } from '../commons/domain/model/Locator.js';
import { LocatorType } from '../commons/domain/model/LocatorType.js';

export class PlaywrightLocator {
  readonly type: LocatorType;
  readonly value: string;

  private constructor(type: LocatorType, value: string) {
    this.type = type;
    this.value = value;
  }

  static byUserDescription(description: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.USER_DESCRIPTION, description);
  }

  static id(id: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.ID, id);
  }

  static xpath(xpath: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.XPATH, xpath);
  }

  static cssSelector(selector: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.CSS_SELECTOR, selector);
  }

  static name(name: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.NAME, name);
  }

  static className(className: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.CLASS, className);
  }

  static tagName(tagName: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.TAG_NAME, tagName);
  }

  static linkText(linkText: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.LINK_TEXT, linkText);
  }

  static partialLinkText(partialLinkText: string): PlaywrightLocator {
    return new PlaywrightLocator(LocatorType.PARTIAL_LINK_TEXT, partialLinkText);
  }

  static from(locator: Locator): PlaywrightLocator {
    return new PlaywrightLocator(locator.type, locator.value);
  }

  toCommonsLocator(): Locator {
    return new Locator(this.type, this.value);
  }

  isUserDescription(): boolean {
    return this.type === LocatorType.USER_DESCRIPTION;
  }

  using(): string {
    switch (this.type) {
      case LocatorType.ID:
        return 'id';
      case LocatorType.XPATH:
        return 'xpath';
      case LocatorType.CSS_SELECTOR:
        return 'css selector';
      case LocatorType.TAG_NAME:
        return 'tag name';
      case LocatorType.LINK_TEXT:
        return 'link text';
      case LocatorType.NAME:
        return 'name';
      case LocatorType.CLASS:
        return 'class name';
      case LocatorType.PARTIAL_LINK_TEXT:
        return 'partial link text';
      case LocatorType.USER_DESCRIPTION:
      default:
        throw new Error('USER_DESCRIPTION locators use gRPC find-by-description');
    }
  }

  toString(): string {
    return `${this.type}: ${this.value}`;
  }
}
