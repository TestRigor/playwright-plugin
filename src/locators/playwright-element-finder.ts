import type { Frame } from 'playwright';
import type { PlaywrightExtensionService } from '../application/extension-service.js';
import { Action } from '../commons/domain/model/Action.js';
import { ActionType } from '../commons/domain/model/ActionType.js';
import { ElementNotFoundException } from '../errors/element-not-found-exception.js';
import type { PlaywrightCommandExecutor } from '../protocol/command-executor.js';
import { ResolvedElement } from '../elements/resolved-element.js';
import { PlaywrightElement } from '../elements/playwright-element.js';
import { PlaywrightLocator } from './playwright-locator.js';
import { resolveFrame, resolveLocator } from './playwright-locator-resolver.js';

export class PlaywrightElementFinder {
  constructor(
    private readonly extensionService: PlaywrightExtensionService,
    private readonly commandExecutor: PlaywrightCommandExecutor,
  ) {}

  async findElement(
    playwrightLocator: PlaywrightLocator,
    parent?: ResolvedElement,
  ): Promise<PlaywrightElement> {
    const locator = playwrightLocator.toCommonsLocator();
    const action = new Action(ActionType.FIND, locator);
    try {
      if (playwrightLocator.isUserDescription()) {
        return this.wrap(
          await this.extensionService.findResolvedByUserDescription(playwrightLocator.value),
        );
      }
      const resolved = await this.resolveLocal(playwrightLocator, parent);
      await this.extensionService.saveAction(action);
      return this.wrap(resolved);
    } catch (notFound) {
      if (!(notFound instanceof ElementNotFoundException)) {
        throw notFound;
      }
      console.info('Trying to self heal with locator %s and value %s', locator.type, locator.value);
      const healed = await this.extensionService.getHealedLocator(locator);
      if (healed == null) {
        throw notFound;
      }
      if (healed.type != null) {
        await this.extensionService.recordHealedFind(locator, healed);
      }
      return this.wrap(await this.resolveLocal(PlaywrightLocator.from(healed), parent));
    }
  }

  async findElements(
    playwrightLocator: PlaywrightLocator,
    parent?: ResolvedElement,
  ): Promise<PlaywrightElement[]> {
    if (playwrightLocator.isUserDescription()) {
      return [
        this.wrap(
          await this.extensionService.findResolvedByUserDescription(playwrightLocator.value),
        ),
      ];
    }
    const matches = await this.resolveMatches(playwrightLocator, parent);
    const count = await matches.count();
    const elements: PlaywrightElement[] = [];
    for (let index = 0; index < count; index++) {
      elements.push(this.wrap(ResolvedElement.fromLocator(matches.nth(index))));
    }
    return elements;
  }

  wrap(resolved: ResolvedElement): PlaywrightElement {
    return new PlaywrightElement(resolved, this);
  }

  private async resolveLocal(
    playwrightLocator: PlaywrightLocator,
    parent?: ResolvedElement,
  ): Promise<ResolvedElement> {
    if (parent != null) {
      return parent.findChild(playwrightLocator.using(), playwrightLocator.value);
    }
    const locator = resolveFrame(
      this.currentFrame(),
      playwrightLocator.using(),
      playwrightLocator.value,
    );
    if ((await locator.count()) === 0) {
      throw new ElementNotFoundException(`Unable to locate element using ${playwrightLocator}`);
    }
    return ResolvedElement.fromLocator(locator.first());
  }

  private async resolveMatches(playwrightLocator: PlaywrightLocator, parent?: ResolvedElement) {
    if (parent == null) {
      return resolveFrame(this.currentFrame(), playwrightLocator.using(), playwrightLocator.value);
    }
    return resolveLocator(parent.toLocator(), playwrightLocator.using(), playwrightLocator.value);
  }

  private currentFrame(): Frame {
    return this.commandExecutor.getPage().mainFrame();
  }
}
