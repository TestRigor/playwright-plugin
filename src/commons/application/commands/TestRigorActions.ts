import type { TestRigorCommandDriver } from './TestRigorCommandDriver.js';
import { TestRigorSteps, type ClickTarget, type EnterTarget } from './TestRigorSteps.js';

/**
 * Fluent facade for execute-only testRigor actions.
 */

export class TestRigorActions {
  static actions(driver: TestRigorCommandDriver): TestRigorActions {
    return new TestRigorActions(driver, TestRigorSteps.create());
  }

  static with(driver: TestRigorCommandDriver): TestRigorActions {
    return TestRigorActions.actions(driver);
  }

  private constructor(
    private readonly driver: TestRigorCommandDriver,
    private readonly steps: TestRigorSteps,
  ) {}

  private withSteps(next: TestRigorSteps): TestRigorActions {
    return new TestRigorActions(this.driver, next);
  }

  /** @internal Used by fluent enter helpers. */
  applyStepMutation(mutator: (steps: TestRigorSteps) => TestRigorSteps): TestRigorActions {
    return this.withSteps(mutator(this.steps));
  }

  /** @internal */
  buildEnterTarget(value: string, fieldDescription: string): EnterTarget {
    return this.steps.enterFluent(value).into(fieldDescription);
  }

  /** @internal */
  replaceSteps(next: TestRigorSteps): TestRigorActions {
    return this.withSteps(next);
  }

  and(): TestRigorActions {
    return this;
  }

  clickOn(elementDescription: string): ContextualClick {
    return new ContextualClick(this, this.steps.clickOn(elementDescription));
  }

  enter(value: string): EnterInto {
    return new EnterInto(value, this);
  }

  enterFluent(value: string): EnterFluent {
    return new EnterFluent(value, this);
  }

  enterStoredValue(varName: string): EnterStoredInto {
    return new EnterStoredInto(varName, this);
  }

  enterKey(keyOrCombo: string): EnterKeyInto {
    return new EnterKeyInto(keyOrCombo, this);
  }

  click(elementDescription: string): TestRigorActions;
  click(nth: number, elementDescription: string): TestRigorActions;
  click(elementDescriptionOrNth: string | number, elementDescription?: string): TestRigorActions {
    if (typeof elementDescriptionOrNth === 'number') {
      return this.withSteps(this.steps.click(elementDescriptionOrNth, elementDescription!));
    }
    return this.withSteps(this.steps.click(elementDescriptionOrNth));
  }

  doubleClick(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.doubleClick(elementDescription));
  }

  rightClick(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.rightClick(elementDescription));
  }

  longClick(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.longClick(elementDescription));
  }

  tripleClick(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.tripleClick(elementDescription));
  }

  middleClick(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.middleClick(elementDescription));
  }

  wheelClick(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.wheelClick(elementDescription));
  }

  clickTimes(elementDescription: string, times: number): TestRigorActions {
    return this.withSteps(this.steps.clickTimes(elementDescription, times));
  }

  doubleClickTimes(elementDescription: string, times: number): TestRigorActions {
    return this.withSteps(this.steps.doubleClickTimes(elementDescription, times));
  }

  tripleClickTimes(elementDescription: string, times: number): TestRigorActions {
    return this.withSteps(this.steps.tripleClickTimes(elementDescription, times));
  }

  rightClickTimes(elementDescription: string, times: number): TestRigorActions {
    return this.withSteps(this.steps.rightClickTimes(elementDescription, times));
  }

  middleClickTimes(elementDescription: string, times: number): TestRigorActions {
    return this.withSteps(this.steps.middleClickTimes(elementDescription, times));
  }

  wheelClickTimes(elementDescription: string, times: number): TestRigorActions {
    return this.withSteps(this.steps.wheelClickTimes(elementDescription, times));
  }

  clickIfExists(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfExists(elementDescription));
  }

  clickIfExistsWithWaiting(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfExistsWithWaiting(elementDescription));
  }

  clickIfExistsWithoutWaiting(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfExistsWithoutWaiting(elementDescription));
  }

  clickAndSwitchToNewTab(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.clickAndSwitchToNewTab(elementDescription));
  }

  clickIfExistsAndSwitchToNewTab(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfExistsAndSwitchToNewTab(elementDescription));
  }

  clickIfExistsWithWaitingAndSwitchToNewTab(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfExistsWithWaitingAndSwitchToNewTab(elementDescription));
  }

  clickIfPageContains(elementDescription: string, expectedText: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfPageContains(elementDescription, expectedText));
  }

  clickIfPageContainsWithWaiting(
    elementDescription: string,
    expectedText: string,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.clickIfPageContainsWithWaiting(elementDescription, expectedText),
    );
  }

  clickIfPageContainsWithoutWaiting(
    elementDescription: string,
    expectedText: string,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.clickIfPageContainsWithoutWaiting(elementDescription, expectedText),
    );
  }

  clickIfPageDoesNotContain(elementDescription: string, expectedText: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfPageDoesNotContain(elementDescription, expectedText));
  }

  clickIfUrlContains(elementDescription: string, expectedText: string): TestRigorActions {
    return this.withSteps(this.steps.clickIfUrlContains(elementDescription, expectedText));
  }

  pressIfPageContains(elementDescription: string, expectedText: string): TestRigorActions {
    return this.withSteps(this.steps.pressIfPageContains(elementDescription, expectedText));
  }

  select(value: string, dropdownDescription: string): TestRigorActions {
    return this.withSteps(this.steps.select(value, dropdownDescription));
  }

  choose(value: string, dropdownDescription: string): TestRigorActions {
    return this.withSteps(this.steps.choose(value, dropdownDescription));
  }

  insert(value: string, fieldDescription: string): TestRigorActions {
    return this.withSteps(this.steps.insert(value, fieldDescription));
  }

  selectNthOption(nthOption: number, dropdownDescription: string): TestRigorActions {
    return this.withSteps(this.steps.selectNthOption(nthOption, dropdownDescription));
  }

  selectOption(optionNumber: number, dropdownDescription: string): TestRigorActions {
    return this.withSteps(this.steps.selectOption(optionNumber, dropdownDescription));
  }

  hoverOver(elementDescription: string): TestRigorActions;
  hoverOver(nth: number, elementDescription: string): TestRigorActions;
  hoverOver(
    elementDescriptionOrNth: string | number,
    elementDescription?: string,
  ): TestRigorActions {
    if (typeof elementDescriptionOrNth === 'number') {
      return this.withSteps(this.steps.hoverOver(elementDescriptionOrNth, elementDescription!));
    }
    return this.withSteps(this.steps.hoverOver(elementDescriptionOrNth));
  }

  scrollDown(): TestRigorActions {
    return this.withSteps(this.steps.scrollDown());
  }

  scrollUp(): TestRigorActions {
    return this.withSteps(this.steps.scrollUp());
  }

  scrollLeft(): TestRigorActions {
    return this.withSteps(this.steps.scrollLeft());
  }

  scrollRight(): TestRigorActions {
    return this.withSteps(this.steps.scrollRight());
  }

  scrollDownOn(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.scrollDownOn(elementDescription));
  }

  scrollUpOn(elementDescription: string): TestRigorActions {
    return this.withSteps(this.steps.scrollUpOn(elementDescription));
  }

  scrollDownUntilPageContains(text: string, maxTimes?: number): TestRigorActions {
    return this.withSteps(this.steps.scrollDownUntilPageContains(text, maxTimes));
  }

  clickUntilPageContains(
    elementDescription: string,
    expectedText: string,
    maxTimes?: number,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.clickUntilPageContains(elementDescription, expectedText, maxTimes),
    );
  }

  clickUntilPageContainsStoredValue(elementDescription: string, varName: string): TestRigorActions {
    return this.withSteps(
      this.steps.clickUntilPageContainsStoredValue(elementDescription, varName),
    );
  }

  clickUntilPageContainsWithWaiting(
    elementDescription: string,
    expectedText: string,
    maxTimes?: number,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.clickUntilPageContainsWithWaiting(elementDescription, expectedText, maxTimes),
    );
  }

  clickUntilPageContainsWithoutWaiting(
    elementDescription: string,
    expectedText: string,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.clickUntilPageContainsWithoutWaiting(elementDescription, expectedText),
    );
  }

  openUrl(url: string): TestRigorActions {
    return this.withSteps(this.steps.openUrl(url));
  }

  goBack(): TestRigorActions {
    return this.withSteps(this.steps.goBack());
  }

  goForward(): TestRigorActions {
    return this.withSteps(this.steps.goForward());
  }

  reload(): TestRigorActions {
    return this.withSteps(this.steps.reload());
  }

  waitSec(seconds: number): TestRigorActions {
    return this.withSteps(this.steps.waitSec(seconds));
  }

  waitUntilPageContains(expectedText: string, maxTimes?: number): TestRigorActions {
    return this.withSteps(this.steps.waitUntilPageContains(expectedText, maxTimes));
  }

  waitUntilPageContainsWithinSeconds(
    expectedText: string,
    timeoutSeconds: number,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.waitUntilPageContainsWithinSeconds(expectedText, timeoutSeconds),
    );
  }

  waitUntilPageContainsWithinSecondsWithWaiting(
    expectedText: string,
    timeoutSeconds: number,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.waitUntilPageContainsWithinSecondsWithWaiting(expectedText, timeoutSeconds),
    );
  }

  drag(sourceDescription: string, targetDescription: string): TestRigorActions {
    return this.withSteps(this.steps.drag(sourceDescription, targetDescription));
  }

  login(): TestRigorActions {
    return this.withSteps(this.steps.login());
  }

  fillOutForm(): TestRigorActions {
    return this.withSteps(this.steps.fillOutForm());
  }

  fillOutRequiredFieldsInForm(): TestRigorActions {
    return this.withSteps(this.steps.fillOutRequiredFieldsInForm());
  }

  type(text: string): TestRigorActions {
    return this.withSteps(this.steps.type(text));
  }

  typeInto(text: string, fieldDescription: string): TestRigorActions {
    return this.withSteps(this.steps.typeInto(text, fieldDescription));
  }

  enterUntilPageContains(
    value: string,
    fieldDescription: string,
    expectedText: string,
  ): TestRigorActions {
    return this.withSteps(this.steps.enterUntilPageContains(value, fieldDescription, expectedText));
  }

  enterStoredValueUntilPageContains(
    varName: string,
    fieldDescription: string,
    expectedText: string,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.enterStoredValueUntilPageContains(varName, fieldDescription, expectedText),
    );
  }

  enterStoredValueUntilPageContainsStoredValue(
    varName: string,
    fieldDescription: string,
    conditionVarName: string,
  ): TestRigorActions {
    return this.withSteps(
      this.steps.enterStoredValueUntilPageContainsStoredValue(
        varName,
        fieldDescription,
        conditionVarName,
      ),
    );
  }

  typeKey(keyOrCombo: string): TestRigorActions {
    return this.withSteps(this.steps.typeKey(keyOrCombo));
  }

  typeKeyIfPageContains(keyOrCombo: string, expectedText: string): TestRigorActions {
    return this.withSteps(this.steps.typeKeyIfPageContains(keyOrCombo, expectedText));
  }

  typeEnter(): TestRigorActions {
    return this.withSteps(this.steps.typeEnter());
  }

  typeTab(): TestRigorActions {
    return this.withSteps(this.steps.typeTab());
  }

  pressKey(keyOrCombo: string): TestRigorActions {
    return this.withSteps(this.steps.pressKey(keyOrCombo));
  }

  pressKeyIfPageContains(keyOrCombo: string, expectedText: string): TestRigorActions {
    return this.withSteps(this.steps.pressKeyIfPageContains(keyOrCombo, expectedText));
  }

  saveValue(value: string, varName: string): TestRigorActions {
    return this.withSteps(this.steps.saveValue(value, varName));
  }

  grabValueFrom(elementDescription: string, varName: string): TestRigorActions {
    return this.withSteps(this.steps.grabValueFrom(elementDescription, varName));
  }

  openNewTab(): TestRigorActions {
    return this.withSteps(this.steps.openNewTab());
  }

  switchToTab(tabIndex: number): TestRigorActions;
  switchToTab(name: string): TestRigorActions;
  switchToTab(tabIndexOrName: number | string): TestRigorActions {
    return this.withSteps(this.steps.switchToTab(tabIndexOrName as never));
  }

  closeTab(): TestRigorActions {
    return this.withSteps(this.steps.closeTab());
  }

  callApi(url: string, varName: string): TestRigorActions {
    return this.withSteps(this.steps.callApi(url, varName));
  }

  paste(): TestRigorActions {
    return this.withSteps(this.steps.paste());
  }

  acceptPromptWithValue(value: string): TestRigorActions {
    return this.withSteps(this.steps.acceptPromptWithValue(value));
  }

  acceptAlert(): TestRigorActions {
    return this.withSteps(this.steps.acceptAlert());
  }

  setGeoLocation(latLong: string): TestRigorActions {
    return this.withSteps(this.steps.setGeoLocation(latLong));
  }

  setGeoLocationStoredValue(varName: string): TestRigorActions {
    return this.withSteps(this.steps.setGeoLocationStoredValue(varName));
  }

  async execute(): Promise<void> {
    await this.driver.executePrompt(this.steps.build());
  }

  buildPrompt(): string {
    return this.steps.build();
  }
}

export class EnterInto {
  constructor(
    private readonly value: string,
    private readonly parent: TestRigorActions,
  ) {}

  into(fieldDescription: string): TestRigorActions {
    return this.parent.applyStepMutation((steps) => steps.enter(this.value).into(fieldDescription));
  }
}

export class EnterFluent {
  constructor(
    private readonly value: string,
    private readonly parent: TestRigorActions,
  ) {}

  into(fieldDescription: string): ContextualEnter {
    return new ContextualEnter(
      this.parent,
      this.parent.buildEnterTarget(this.value, fieldDescription),
    );
  }
}

export class EnterStoredInto {
  constructor(
    private readonly varName: string,
    private readonly parent: TestRigorActions,
  ) {}

  into(fieldDescription: string): TestRigorActions {
    return this.parent.applyStepMutation((steps) =>
      steps.enterStoredValue(this.varName).into(fieldDescription),
    );
  }
}

export class EnterKeyInto {
  constructor(
    private readonly keyOrCombo: string,
    private readonly parent: TestRigorActions,
  ) {}

  into(fieldDescription: string): TestRigorActions {
    return this.parent.applyStepMutation((steps) =>
      steps.enterKey(this.keyOrCombo).into(fieldDescription),
    );
  }
}

export class ContextualClick {
  constructor(
    private readonly parent: TestRigorActions,
    private readonly clickTarget: ClickTarget,
  ) {}

  withinTable(tableDescription: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.withinTable(tableDescription));
  }

  rowContaining(rowContaining: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.rowContaining(rowContaining));
  }

  column(columnDescription: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.column(columnDescription));
  }

  inContext(contextDescription: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.inContext(contextDescription));
  }

  below(anchorDescription: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.below(anchorDescription));
  }

  roughlyBelow(anchorDescription: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.roughlyBelow(anchorDescription));
  }

  completelyBelow(anchorDescription: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.completelyBelow(anchorDescription));
  }

  rightOf(anchorDescription: string): ContextualClick {
    return new ContextualClick(this.parent, this.clickTarget.rightOf(anchorDescription));
  }

  and(): ContextualClick {
    return this;
  }

  add(): TestRigorActions {
    return this.parent.replaceSteps(this.clickTarget.add());
  }
}

export class ContextualEnter {
  constructor(
    private readonly parent: TestRigorActions,
    private readonly enterTarget: EnterTarget,
  ) {}

  withinTable(tableDescription: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.withinTable(tableDescription));
  }

  rowContaining(rowContaining: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.rowContaining(rowContaining));
  }

  column(columnDescription: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.column(columnDescription));
  }

  inContext(contextDescription: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.inContext(contextDescription));
  }

  below(anchorDescription: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.below(anchorDescription));
  }

  roughlyBelow(anchorDescription: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.roughlyBelow(anchorDescription));
  }

  completelyBelow(anchorDescription: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.completelyBelow(anchorDescription));
  }

  rightOf(anchorDescription: string): ContextualEnter {
    return new ContextualEnter(this.parent, this.enterTarget.rightOf(anchorDescription));
  }

  and(): ContextualEnter {
    return this;
  }

  add(): TestRigorActions {
    return this.parent.replaceSteps(this.enterTarget.add());
  }
}
