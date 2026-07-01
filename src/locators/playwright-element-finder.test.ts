import type { Frame, Locator, Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import type { PlaywrightExtensionService } from '../application/extension-service.js';
import { Locator as CommonsLocator } from '../commons/domain/model/Locator.js';
import { LocatorType } from '../commons/domain/model/LocatorType.js';
import { PlaywrightElement } from '../elements/playwright-element.js';
import { ResolvedElement } from '../elements/resolved-element.js';
import type { PlaywrightCommandExecutor } from '../protocol/command-executor.js';
import { PlaywrightElementFinder } from './playwright-element-finder.js';
import { PlaywrightLocator } from './playwright-locator.js';

describe('PlaywrightElementFinder', () => {
  it('findElement by user description delegates to extension service', async () => {
    const service = {
      findResolvedByUserDescription: vi.fn(),
      saveAction: vi.fn(),
    } as unknown as PlaywrightExtensionService;
    const executor = {} as PlaywrightCommandExecutor;
    const locator = {
      innerText: vi.fn().mockResolvedValue('Submit'),
    } as unknown as Locator;
    const resolved = ResolvedElement.fromLocator(locator);
    service.findResolvedByUserDescription = vi.fn().mockResolvedValue(resolved);

    const finder = new PlaywrightElementFinder(service, executor);
    const element = await finder.findElement(PlaywrightLocator.byUserDescription('Submit'));

    expect(element).toBeInstanceOf(PlaywrightElement);
    expect(await element.getText()).toBe('Submit');
    expect(service.findResolvedByUserDescription).toHaveBeenCalledWith('Submit');
  });

  it('findElement saves action for resolved locators', async () => {
    const service = {
      findResolvedByUserDescription: vi.fn(),
      saveAction: vi.fn().mockResolvedValue(undefined),
    } as unknown as PlaywrightExtensionService;
    const first = {} as Locator;
    const match = {
      count: vi.fn().mockResolvedValue(1),
      first: vi.fn().mockReturnValue(first),
    } as unknown as Locator;
    const frame = {
      locator: vi.fn().mockReturnValue(match),
    } as unknown as Frame;
    const page = {
      mainFrame: vi.fn().mockReturnValue(frame),
    } as unknown as Page;
    const executor = {
      getPage: vi.fn().mockReturnValue(page),
    } as unknown as PlaywrightCommandExecutor;

    const finder = new PlaywrightElementFinder(service, executor);
    await finder.findElement(PlaywrightLocator.id('ok'));

    expect(service.saveAction).toHaveBeenCalledOnce();
  });

  it('findElement self-heals via extension service when local locator fails', async () => {
    const original = new CommonsLocator(LocatorType.ID, 'broken-changer');
    const healed = new CommonsLocator(LocatorType.ID, 'changer');
    const service = {
      findResolvedByUserDescription: vi.fn(),
      saveAction: vi.fn(),
      getHealedLocator: vi.fn().mockResolvedValue(healed),
      recordHealedFind: vi.fn().mockResolvedValue(undefined),
    } as unknown as PlaywrightExtensionService;

    const healedPlaywrightLocator = {} as Locator;
    const healedMatch = {
      count: vi.fn().mockResolvedValue(1),
      first: vi.fn().mockReturnValue(healedPlaywrightLocator),
    };
    const missingMatch = {
      count: vi.fn().mockResolvedValue(0),
      first: vi.fn(),
    };
    const frame = {
      locator: vi.fn().mockImplementation((selector: string) => {
        if (selector === '#broken-changer') {
          return missingMatch;
        }
        if (selector === '#changer') {
          return healedMatch;
        }
        throw new Error(`Unexpected selector: ${selector}`);
      }),
    } as unknown as Frame;
    const page = {
      mainFrame: vi.fn().mockReturnValue(frame),
    } as unknown as Page;
    const executor = {
      getPage: vi.fn().mockReturnValue(page),
    } as unknown as PlaywrightCommandExecutor;

    const finder = new PlaywrightElementFinder(service, executor);
    const element = await finder.findElement(PlaywrightLocator.id('broken-changer'));

    expect(element).toBeInstanceOf(PlaywrightElement);
    expect(service.getHealedLocator).toHaveBeenCalledWith(original);
    expect(service.recordHealedFind).toHaveBeenCalledWith(original, healed);
    expect(service.saveAction).not.toHaveBeenCalled();
  });
});
