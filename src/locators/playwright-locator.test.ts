import { describe, expect, it } from 'vitest';
import { LocatorType } from '../commons/domain/model/LocatorType.js';
import { PlaywrightLocator } from './playwright-locator.js';

describe('PlaywrightLocator', () => {
  it('byUserDescription maps to commons locator', () => {
    const locator = PlaywrightLocator.byUserDescription('Login');

    expect(locator.isUserDescription()).toBe(true);
    expect(locator.toCommonsLocator().type).toBe(LocatorType.USER_DESCRIPTION);
    expect(locator.toCommonsLocator().value).toBe('Login');
  });

  it('id using returns locator strategy name', () => {
    expect(PlaywrightLocator.id('x').using()).toBe('id');
  });
});
