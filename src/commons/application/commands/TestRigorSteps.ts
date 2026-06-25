import { quotedSegment } from './StepEscaping.js';

const MAX_ORDINAL_INDEX = 20;

/**
 * Fluent builder for testRigor plain-English command steps.
 * Each step is one line; build() returns the full prompt (newline-separated).
 * Syntax follows https://testrigor.com/docs/language.
 */
export class TestRigorSteps {
  static create(): TestRigorSteps {
    return new TestRigorSteps([]);
  }

  private constructor(private readonly steps: string[]) {}

  private appendStep(line: string): TestRigorSteps {
    return new TestRigorSteps([...this.steps, line]);
  }

  /** @internal */
  stepWith(line: string): TestRigorSteps {
    return this.appendStep(line);
  }

  /** @internal */
  static renderClickLinePublic(
    elementDescription: string,
    tableDescription: string | null,
    rowContaining: string | null,
    columnDescription: string | null,
    contextDescription: string | null,
    belowAnchor: Anchor | null,
    rightAnchor: Anchor | null,
  ): string {
    return TestRigorSteps.renderClickLine(
      elementDescription,
      tableDescription,
      rowContaining,
      columnDescription,
      contextDescription,
      belowAnchor,
      rightAnchor,
    );
  }

  /** @internal */
  static renderEnterLinePublic(
    value: string,
    fieldDescription: string,
    tableDescription: string | null,
    rowContaining: string | null,
    columnDescription: string | null,
    contextDescription: string | null,
    belowAnchor: Anchor | null,
    rightAnchor: Anchor | null,
  ): string {
    return TestRigorSteps.renderEnterLine(
      value,
      fieldDescription,
      tableDescription,
      rowContaining,
      columnDescription,
      contextDescription,
      belowAnchor,
      rightAnchor,
    );
  }

  /** @internal */
  static rawTokenPublic(value: string | null | undefined): string {
    return TestRigorSteps.rawToken(value);
  }

  and(): TestRigorSteps {
    return this;
  }

  clickOn(elementDescription: string): ClickTarget {
    return new ClickTarget(this, elementDescription, null, null, null, null, null, null);
  }

  enter(value: string): EnterInto {
    return new EnterInto(value, this);
  }

  enterFluent(value: string): EnterTargetInto {
    return new EnterTargetInto(value, this);
  }

  enterStoredValue(varName: string): EnterStoredInto {
    return new EnterStoredInto(varName, this);
  }

  enterKey(keyOrCombo: string): EnterKeyInto {
    return new EnterKeyInto(keyOrCombo, this);
  }

  build(): string {
    return this.steps.join('\n');
  }

  private static ordinal(position: number): string {
    if (position < 1 || position > MAX_ORDINAL_INDEX) {
      return String(position);
    }
    const ordinals = [
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
      '10th',
      '11th',
      '12th',
      '13th',
      '14th',
      '15th',
      '16th',
      '17th',
      '18th',
      '19th',
      '20th',
    ];
    return ordinals[position - 1]!;
  }

  private clickTimesLine(
    clickPrefix: string,
    elementDescription: string,
    times: number,
  ): TestRigorSteps {
    return this.appendStep(`${clickPrefix} ${quotedSegment(elementDescription)} ${times} times`);
  }

  private static renderClickLine(
    elementDescription: string,
    tableDescription: string | null,
    rowContaining: string | null,
    columnDescription: string | null,
    contextDescription: string | null,
    belowAnchor: Anchor | null,
    rightAnchor: Anchor | null,
  ): string {
    const line = `click on ${quotedSegment(elementDescription)}`;
    return TestRigorSteps.appendContextAndAnchors(
      line,
      tableDescription,
      rowContaining,
      columnDescription,
      contextDescription,
      belowAnchor,
      rightAnchor,
    );
  }

  private static renderEnterLine(
    value: string,
    fieldDescription: string,
    tableDescription: string | null,
    rowContaining: string | null,
    columnDescription: string | null,
    contextDescription: string | null,
    belowAnchor: Anchor | null,
    rightAnchor: Anchor | null,
  ): string {
    const line = `enter ${quotedSegment(value)} into ${quotedSegment(fieldDescription)}`;
    return TestRigorSteps.appendContextAndAnchors(
      line,
      tableDescription,
      rowContaining,
      columnDescription,
      contextDescription,
      belowAnchor,
      rightAnchor,
    );
  }

  private static appendContextAndAnchors(
    line: string,
    tableDescription: string | null,
    rowContaining: string | null,
    columnDescription: string | null,
    contextDescription: string | null,
    belowAnchor: Anchor | null,
    rightAnchor: Anchor | null,
  ): string {
    let result = line;
    if (tableDescription != null) {
      result += ` within the context of table ${quotedSegment(tableDescription)}`;
      if (rowContaining != null) {
        result += ` at row containing ${quotedSegment(rowContaining)}`;
      }
      if (columnDescription != null) {
        result += rowContaining != null ? ' and' : ' at';
        result += ` column ${quotedSegment(columnDescription)}`;
      }
    } else if (contextDescription != null) {
      result += ` within the context of ${quotedSegment(contextDescription)}`;
    }

    if (belowAnchor != null) {
      result += ` ${belowAnchor.render()}`;
    }
    if (rightAnchor != null) {
      result += belowAnchor == null ? ` ${rightAnchor.render()}` : ` and ${rightAnchor.render()}`;
    }
    return result;
  }

  private static rawToken(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  click(elementDescription: string): TestRigorSteps;
  click(nth: number, elementDescription: string): TestRigorSteps;
  click(elementDescriptionOrNth: string | number, elementDescription?: string): TestRigorSteps {
    if (typeof elementDescriptionOrNth === 'number') {
      return this.appendStep(
        'click on the ' +
          TestRigorSteps.ordinal(elementDescriptionOrNth) +
          ' ' +
          quotedSegment(elementDescription!),
      );
    }
    return this.appendStep('click ' + quotedSegment(elementDescriptionOrNth));
  }

  clickTimes(elementDescription: string, times: number): TestRigorSteps {
    return this.clickTimesLine('click', elementDescription, times);
  }

  doubleClickTimes(elementDescription: string, times: number): TestRigorSteps {
    return this.clickTimesLine('double click', elementDescription, times);
  }

  tripleClickTimes(elementDescription: string, times: number): TestRigorSteps {
    return this.clickTimesLine('triple click', elementDescription, times);
  }

  rightClickTimes(elementDescription: string, times: number): TestRigorSteps {
    return this.clickTimesLine('right click', elementDescription, times);
  }

  middleClickTimes(elementDescription: string, times: number): TestRigorSteps {
    return this.clickTimesLine('middle click', elementDescription, times);
  }

  wheelClickTimes(elementDescription: string, times: number): TestRigorSteps {
    return this.clickTimesLine('wheel click', elementDescription, times);
  }

  tap(elementDescription: string): TestRigorSteps {
    return this.appendStep('tap on ' + quotedSegment(elementDescription));
  }

  press(elementDescription: string): TestRigorSteps {
    return this.appendStep('press ' + quotedSegment(elementDescription));
  }

  push(elementDescription: string): TestRigorSteps {
    return this.appendStep('push ' + quotedSegment(elementDescription));
  }

  follow(elementDescription: string): TestRigorSteps {
    return this.appendStep('follow ' + quotedSegment(elementDescription));
  }

  doubleClick(elementDescription: string): TestRigorSteps {
    return this.appendStep('double click on ' + quotedSegment(elementDescription));
  }

  rightClick(elementDescription: string): TestRigorSteps {
    return this.appendStep('right click on ' + quotedSegment(elementDescription));
  }

  longClick(elementDescription: string): TestRigorSteps {
    return this.appendStep('long click on ' + quotedSegment(elementDescription));
  }

  tripleClick(elementDescription: string): TestRigorSteps {
    return this.appendStep('triple click ' + quotedSegment(elementDescription));
  }

  middleClick(elementDescription: string): TestRigorSteps {
    return this.appendStep('middle click ' + quotedSegment(elementDescription));
  }

  wheelClick(elementDescription: string): TestRigorSteps {
    return this.appendStep('wheel click ' + quotedSegment(elementDescription));
  }

  clickIfExists(elementDescription: string): TestRigorSteps {
    return this.appendStep('click ' + quotedSegment(elementDescription) + ' if exists');
  }

  clickIfExistsWithWaiting(elementDescription: string): TestRigorSteps {
    return this.appendStep(
      'click ' + quotedSegment(elementDescription) + ' if exists with waiting',
    );
  }

  clickIfExistsWithoutWaiting(elementDescription: string): TestRigorSteps {
    return this.appendStep(
      'click ' + quotedSegment(elementDescription) + ' if exists without waiting',
    );
  }

  clickAndSwitchToNewTab(elementDescription: string): TestRigorSteps {
    return this.appendStep(
      'click ' + quotedSegment(elementDescription) + ' and switch to the new tab',
    );
  }

  clickIfExistsAndSwitchToNewTab(elementDescription: string): TestRigorSteps {
    return this.appendStep(
      'click ' + quotedSegment(elementDescription) + ' if exists and switch to the new tab',
    );
  }

  clickIfExistsWithWaitingAndSwitchToNewTab(elementDescription: string): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' if exists with waiting and switch to the new tab',
    );
  }

  clickIfPageContains(elementDescription: string, expectedText: string): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' if page contains ' +
        quotedSegment(expectedText),
    );
  }

  clickIfPageContainsWithWaiting(elementDescription: string, expectedText: string): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' if page contains ' +
        quotedSegment(expectedText) +
        ' with waiting',
    );
  }

  clickIfPageContainsWithoutWaiting(
    elementDescription: string,
    expectedText: string,
  ): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' if page contains ' +
        quotedSegment(expectedText) +
        ' without waiting',
    );
  }

  clickIfPageDoesNotContain(elementDescription: string, expectedText: string): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' if page does not contain ' +
        quotedSegment(expectedText),
    );
  }

  clickIfUrlContains(elementDescription: string, expectedText: string): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' if url contains ' +
        quotedSegment(expectedText),
    );
  }

  pressIfPageContains(elementDescription: string, expectedText: string): TestRigorSteps {
    return this.appendStep(
      'press ' +
        quotedSegment(elementDescription) +
        ' if page contains ' +
        quotedSegment(expectedText),
    );
  }

  select(value: string, dropdownDescription: string): TestRigorSteps {
    return this.appendStep(
      'select ' + quotedSegment(value) + ' from ' + quotedSegment(dropdownDescription),
    );
  }

  choose(value: string, dropdownDescription: string): TestRigorSteps {
    return this.appendStep(
      'choose ' + quotedSegment(value) + ' from ' + quotedSegment(dropdownDescription),
    );
  }

  insert(value: string, fieldDescription: string): TestRigorSteps {
    return this.appendStep(
      'insert ' + quotedSegment(value) + ' into ' + quotedSegment(fieldDescription),
    );
  }

  selectNthOption(nthOption: number, dropdownDescription: string): TestRigorSteps {
    return this.appendStep(
      'select ' +
        TestRigorSteps.ordinal(nthOption) +
        ' option from ' +
        quotedSegment(dropdownDescription),
    );
  }

  selectOption(optionNumber: number, dropdownDescription: string): TestRigorSteps {
    return this.appendStep(
      'select option ' + optionNumber + ' from ' + quotedSegment(dropdownDescription),
    );
  }

  checkPageContains(text: string): TestRigorSteps {
    return this.appendStep('check that page contains ' + quotedSegment(text));
  }

  checkPageDoesNotContain(text: string): TestRigorSteps {
    return this.appendStep('check that page does not contain ' + quotedSegment(text));
  }

  checkPageContainsStoredValue(varName: string): TestRigorSteps {
    return this.appendStep('check that page contains stored value from ' + quotedSegment(varName));
  }

  checkPageContainsRegex(regex: string): TestRigorSteps {
    return this.appendStep('check that page has regex ' + quotedSegment(regex));
  }

  checkPageDoesNotContainRegex(regex: string): TestRigorSteps {
    return this.appendStep('check that page does not have regex ' + quotedSegment(regex));
  }

  checkPageContainsTemplate(template: string): TestRigorSteps {
    return this.appendStep('check that page has simple template ' + quotedSegment(template));
  }

  checkPageDoesNotContainTemplate(template: string): TestRigorSteps {
    return this.appendStep(
      'check that page does not have simple template ' + quotedSegment(template),
    );
  }

  checkPageDidNotChange(): TestRigorSteps {
    return this.appendStep("check that page didn't change");
  }

  checkUrlContains(text: string): TestRigorSteps {
    return this.appendStep('check that url contains ' + quotedSegment(text));
  }

  checkUrlDoesNotContain(text: string): TestRigorSteps {
    return this.appendStep('check that url does not contain ' + quotedSegment(text));
  }

  checkUrlStartsWith(prefix: string): TestRigorSteps {
    return this.appendStep('check that url starts with ' + quotedSegment(prefix));
  }

  checkUrlDoesNotStartWith(prefix: string): TestRigorSteps {
    return this.appendStep('check that url does not start with ' + quotedSegment(prefix));
  }

  checkUrlEndsWith(suffix: string): TestRigorSteps {
    return this.appendStep('check that url ends with ' + quotedSegment(suffix));
  }

  checkUrlDoesNotEndWith(suffix: string): TestRigorSteps {
    return this.appendStep('check that url does not end with ' + quotedSegment(suffix));
  }

  checkUrlIs(url: string): TestRigorSteps {
    return this.appendStep('check that url is ' + quotedSegment(url));
  }

  checkUrlIsNot(url: string): TestRigorSteps {
    return this.appendStep('check that url is not ' + quotedSegment(url));
  }

  checkUrlMatchesRegex(regex: string): TestRigorSteps {
    return this.appendStep('check that url matches regex ' + quotedSegment(regex));
  }

  checkUrlDoesNotMatchRegex(regex: string): TestRigorSteps {
    return this.appendStep('check that url does not match regex ' + quotedSegment(regex));
  }

  checkPageTitleIs(title: string): TestRigorSteps {
    return this.appendStep('check that page title is ' + quotedSegment(title));
  }

  checkPageTitleContains(text: string): TestRigorSteps {
    return this.appendStep('check that page title contains ' + quotedSegment(text));
  }

  checkPageReturnCode(code: string): TestRigorSteps {
    return this.appendStep('check that page return code is ' + quotedSegment(code));
  }

  checkButtonDisabled(buttonDescription: string): TestRigorSteps {
    return this.appendStep(
      'check that button ' + quotedSegment(buttonDescription) + ' is disabled',
    );
  }

  checkButtonEnabled(buttonDescription: string): TestRigorSteps {
    return this.appendStep('check that button ' + quotedSegment(buttonDescription) + ' is enabled');
  }

  checkThatElementContains(elementDescription: string, text: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' contains ' + quotedSegment(text),
    );
  }

  checkThatElementDoesNotContain(elementDescription: string, text: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' does not contain ' +
        quotedSegment(text),
    );
  }

  checkThatElementContainsStoredValue(elementDescription: string, varName: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' contains stored value from ' +
        quotedSegment(varName),
    );
  }

  checkThatElementDoesNotContainStoredValue(
    elementDescription: string,
    varName: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' does not contain stored value from ' +
        quotedSegment(varName),
    );
  }

  checkThatInputHasValue(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that input ' +
        quotedSegment(elementDescription) +
        ' has value ' +
        quotedSegment(value),
    );
  }

  checkThatInputHasStoredValue(elementDescription: string, varName: string): TestRigorSteps {
    return this.appendStep(
      'check that input ' +
        quotedSegment(elementDescription) +
        ' has value stored value from ' +
        quotedSegment(varName),
    );
  }

  checkThatInputDoesNotHaveValue(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that input ' +
        quotedSegment(elementDescription) +
        ' does not have value ' +
        quotedSegment(value),
    );
  }

  checkThatInputDoesNotHaveStoredValue(
    elementDescription: string,
    varName: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that input ' +
        quotedSegment(elementDescription) +
        ' does not have value stored value from ' +
        quotedSegment(varName),
    );
  }

  checkThatCheckboxIsChecked(elementDescription: string): TestRigorSteps {
    return this.appendStep(
      'check that checkbox ' + quotedSegment(elementDescription) + ' is checked',
    );
  }

  checkThatCheckboxIsUnchecked(elementDescription: string): TestRigorSteps {
    return this.appendStep(
      'check that checkbox ' + quotedSegment(elementDescription) + ' is unchecked',
    );
  }

  checkThatElementIsEnabled(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is enabled');
  }

  checkThatElementIsDisabled(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is disabled');
  }

  checkThatElementIsVisible(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is visible');
  }

  checkThatElementIsInvisible(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is invisible');
  }

  checkThatElementIsClickable(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is clickable');
  }

  checkThatElementIsNotClickable(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is not clickable');
  }

  checkThatSelectHasOptionSelected(elementDescription: string, option: string): TestRigorSteps {
    return this.appendStep(
      'check that select ' +
        quotedSegment(elementDescription) +
        ' has option selected ' +
        quotedSegment(option),
    );
  }

  checkThatSelectDoesNotHaveOptionSelected(
    elementDescription: string,
    option: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that select ' +
        quotedSegment(elementDescription) +
        ' does not have option selected ' +
        quotedSegment(option),
    );
  }

  checkThatElementMatchesRegex(elementDescription: string, regex: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' matches regex ' + quotedSegment(regex),
    );
  }

  checkThatElementDoesNotMatchRegex(elementDescription: string, regex: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' does not match regex ' +
        quotedSegment(regex),
    );
  }

  checkThatElementMatchesTemplate(elementDescription: string, template: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' matches template ' +
        quotedSegment(template),
    );
  }

  checkThatElementDoesNotMatchTemplate(
    elementDescription: string,
    template: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' does not match template ' +
        quotedSegment(template),
    );
  }

  checkThatElementHasAttribute(
    elementDescription: string,
    attributeName: string,
    expectedValue: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' has attribute ' +
        quotedSegment(attributeName) +
        ' equal to ' +
        quotedSegment(expectedValue),
    );
  }

  checkThatElementDoesNotHaveAttribute(
    elementDescription: string,
    attributeName: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' does not have attribute ' +
        quotedSegment(attributeName),
    );
  }

  checkThatElementHasProperty(
    elementDescription: string,
    propertyName: string,
    expectedValue: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' has property ' +
        quotedSegment(propertyName) +
        ' equal to ' +
        quotedSegment(expectedValue),
    );
  }

  checkThatElementDoesNotHaveProperty(
    elementDescription: string,
    propertyName: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' does not have property ' +
        quotedSegment(propertyName),
    );
  }

  checkThatElementHasCssClass(elementDescription: string, cssClass: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' has css class ' +
        quotedSegment(cssClass),
    );
  }

  checkThatElementDoesNotHaveCssClass(
    elementDescription: string,
    cssClass: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' does not have css class ' +
        quotedSegment(cssClass),
    );
  }

  checkThatElementColorIs(elementDescription: string, color: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' color is ' + quotedSegment(color),
    );
  }

  checkThatElementColorIsNot(elementDescription: string, color: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' color is not ' + quotedSegment(color),
    );
  }

  checkThatElementBackgroundColorIs(elementDescription: string, color: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' background color is ' +
        quotedSegment(color),
    );
  }

  checkThatElementBackgroundColorIsNot(elementDescription: string, color: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' background color is not ' +
        quotedSegment(color),
    );
  }

  checkThatElementCursorIs(elementDescription: string, cursor: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' cursor is ' + quotedSegment(cursor),
    );
  }

  checkThatElementCursorIsNot(elementDescription: string, cursor: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' cursor is not ' + quotedSegment(cursor),
    );
  }

  checkThatElementHasLineStyle(elementDescription: string, lineStyle: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' has line style ' +
        quotedSegment(lineStyle),
    );
  }

  checkThatElementHasNotLineStyle(elementDescription: string, lineStyle: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' has not line style ' +
        quotedSegment(lineStyle),
    );
  }

  checkThatElementIsBlank(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is blank');
  }

  checkThatElementIsNotBlank(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is not blank');
  }

  checkThatElementIsNull(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is null');
  }

  checkThatElementIsNotNull(elementDescription: string): TestRigorSteps {
    return this.appendStep('check that ' + quotedSegment(elementDescription) + ' is not null');
  }

  checkThatElementIsEqual(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' is equal to ' + quotedSegment(value),
    );
  }

  checkThatElementIsNotEqual(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' is not equal to ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsEqualAsNumber(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' is equal as number to ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsNotEqualAsNumber(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' is not equal as number to ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsGreaterThan(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' is greater than ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsGreaterThanOrEqualTo(
    elementDescription: string,
    value: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' is greater than or equal to ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsLessThan(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that ' + quotedSegment(elementDescription) + ' is less than ' + quotedSegment(value),
    );
  }

  checkThatElementIsLessThanOrEqualTo(elementDescription: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' is less than or equal to ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsLexicographicallyBefore(
    elementDescription: string,
    value: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' lexicographically before ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsLexicographicallyBeforeOrSame(
    elementDescription: string,
    value: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' lexicographically before or same ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsLexicographicallyAfter(
    elementDescription: string,
    value: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' lexicographically after ' +
        quotedSegment(value),
    );
  }

  checkThatElementIsLexicographicallyAfterOrSame(
    elementDescription: string,
    value: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that ' +
        quotedSegment(elementDescription) +
        ' lexicographically after or same ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfContains(varName: string, text: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself contains ' +
        quotedSegment(text),
    );
  }

  checkThatStoredValueItselfDoesNotContain(varName: string, text: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself does not contain ' +
        quotedSegment(text),
    );
  }

  checkThatStoredValueItselfMatchesRegex(varName: string, regex: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself matches regex ' +
        quotedSegment(regex),
    );
  }

  checkThatStoredValueItselfDoesNotMatchRegex(varName: string, regex: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself does not match regex ' +
        quotedSegment(regex),
    );
  }

  checkThatStoredValueItselfMatchesTemplate(varName: string, template: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself matches template ' +
        quotedSegment(template),
    );
  }

  checkThatStoredValueItselfDoesNotMatchTemplate(
    varName: string,
    template: string,
  ): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself does not match template ' +
        quotedSegment(template),
    );
  }

  checkThatStoredValueItselfIsBlank(varName: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' + quotedSegment(varName) + ' itself is blank',
    );
  }

  checkThatStoredValueItselfIsNotBlank(varName: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' + quotedSegment(varName) + ' itself is not blank',
    );
  }

  checkThatStoredValueItselfIsNull(varName: string): TestRigorSteps {
    return this.appendStep('check that stored value ' + quotedSegment(varName) + ' itself is null');
  }

  checkThatStoredValueItselfIsNotNull(varName: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' + quotedSegment(varName) + ' itself is not null',
    );
  }

  checkThatStoredValueItselfIsEqual(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is equal to ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfIsNotEqual(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is not equal to ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfIsEqualAsNumber(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is equal as number to ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfIsNotEqualAsNumber(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is not equal as number to ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfIsGreaterThan(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is greater than ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfIsGreaterThanOrEqualTo(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is greater than or equal to ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfIsLessThan(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is less than ' +
        quotedSegment(value),
    );
  }

  checkThatStoredValueItselfIsLessThanOrEqualTo(varName: string, value: string): TestRigorSteps {
    return this.appendStep(
      'check that stored value ' +
        quotedSegment(varName) +
        ' itself is less than or equal to ' +
        quotedSegment(value),
    );
  }

  hoverOver(elementDescription: string): TestRigorSteps;
  hoverOver(nth: number, elementDescription: string): TestRigorSteps;
  hoverOver(elementDescriptionOrNth: string | number, elementDescription?: string): TestRigorSteps {
    if (typeof elementDescriptionOrNth === 'number') {
      return this.appendStep(
        'hover over ' +
          TestRigorSteps.ordinal(elementDescriptionOrNth) +
          ' ' +
          quotedSegment(elementDescription!),
      );
    }
    return this.appendStep('hover over ' + quotedSegment(elementDescriptionOrNth));
  }

  scrollDown(): TestRigorSteps {
    return this.appendStep('scroll down');
  }

  scrollUp(): TestRigorSteps {
    return this.appendStep('scroll up');
  }

  scrollLeft(): TestRigorSteps {
    return this.appendStep('scroll left');
  }

  scrollRight(): TestRigorSteps {
    return this.appendStep('scroll right');
  }

  scrollDownOn(elementDescription: string): TestRigorSteps {
    return this.appendStep('scroll down on ' + quotedSegment(elementDescription));
  }

  scrollUpOn(elementDescription: string): TestRigorSteps {
    return this.appendStep('scroll up on ' + quotedSegment(elementDescription));
  }

  scrollDownUntilPageContains(text: string, maxTimes?: number): TestRigorSteps {
    if (maxTimes === undefined) {
      return this.appendStep('scroll down until page contains ' + quotedSegment(text));
    }
    return this.appendStep(
      'scroll down up to ' + maxTimes + ' times until page contains ' + quotedSegment(text),
    );
  }

  clickUntilPageContains(
    elementDescription: string,
    expectedText: string,
    maxTimes?: number,
  ): TestRigorSteps {
    if (maxTimes === undefined) {
      return this.appendStep(
        'click ' +
          quotedSegment(elementDescription) +
          ' until page contains ' +
          quotedSegment(expectedText),
      );
    }
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' up to ' +
        maxTimes +
        ' times until page contains ' +
        quotedSegment(expectedText),
    );
  }

  clickUntilPageContainsStoredValue(elementDescription: string, varName: string): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' until page contains stored value ' +
        quotedSegment(varName),
    );
  }

  clickUntilPageContainsWithWaiting(
    elementDescription: string,
    expectedText: string,
    maxTimes?: number,
  ): TestRigorSteps {
    if (maxTimes === undefined) {
      return this.appendStep(
        'click ' +
          quotedSegment(elementDescription) +
          ' until page contains ' +
          quotedSegment(expectedText) +
          ' with waiting',
      );
    }
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' up to ' +
        maxTimes +
        ' times until page contains ' +
        quotedSegment(expectedText) +
        ' with waiting',
    );
  }

  clickUntilPageContainsWithoutWaiting(
    elementDescription: string,
    expectedText: string,
  ): TestRigorSteps {
    return this.appendStep(
      'click ' +
        quotedSegment(elementDescription) +
        ' until page contains ' +
        quotedSegment(expectedText) +
        ' without waiting',
    );
  }

  openUrl(url: string): TestRigorSteps {
    return this.appendStep('open url ' + quotedSegment(url));
  }

  goBack(): TestRigorSteps {
    return this.appendStep('go back');
  }

  goForward(): TestRigorSteps {
    return this.appendStep('go forward');
  }

  reload(): TestRigorSteps {
    return this.appendStep('reload');
  }

  waitSec(seconds: number): TestRigorSteps {
    return this.appendStep('wait ' + seconds + ' sec');
  }

  waitUntilPageContains(expectedText: string, maxTimes?: number): TestRigorSteps {
    if (maxTimes === undefined) {
      return this.appendStep('wait 1 sec until page contains ' + quotedSegment(expectedText));
    }
    return this.appendStep(
      'wait 1 sec up to ' + maxTimes + ' times until page contains ' + quotedSegment(expectedText),
    );
  }

  waitUntilPageContainsWithinSeconds(expectedText: string, timeoutSeconds: number): TestRigorSteps {
    return this.appendStep(
      'wait up to ' +
        timeoutSeconds +
        ' seconds until page contains ' +
        quotedSegment(expectedText),
    );
  }

  waitUntilPageContainsWithinSecondsWithWaiting(
    expectedText: string,
    timeoutSeconds: number,
  ): TestRigorSteps {
    return this.appendStep(
      'wait up to ' +
        timeoutSeconds +
        ' seconds until page contains ' +
        quotedSegment(expectedText) +
        ' with waiting',
    );
  }

  drag(sourceDescription: string, targetDescription: string): TestRigorSteps {
    return this.appendStep(
      'drag ' + quotedSegment(sourceDescription) + ' to ' + quotedSegment(targetDescription),
    );
  }

  login(): TestRigorSteps {
    return this.appendStep('login');
  }

  fillOutForm(): TestRigorSteps {
    return this.appendStep('fill out form');
  }

  fillOutRequiredFieldsInForm(): TestRigorSteps {
    return this.appendStep('fill out required fields in form');
  }

  type(text: string): TestRigorSteps {
    return this.appendStep('type ' + quotedSegment(text));
  }

  typeInto(text: string, fieldDescription: string): TestRigorSteps {
    return this.appendStep(
      'type ' + quotedSegment(text) + ' into ' + quotedSegment(fieldDescription),
    );
  }

  enterUntilPageContains(
    value: string,
    fieldDescription: string,
    expectedText: string,
  ): TestRigorSteps {
    return this.appendStep(
      'enter ' +
        quotedSegment(value) +
        ' into ' +
        quotedSegment(fieldDescription) +
        ' until page contains ' +
        quotedSegment(expectedText),
    );
  }

  enterStoredValueUntilPageContains(
    varName: string,
    fieldDescription: string,
    expectedText: string,
  ): TestRigorSteps {
    return this.appendStep(
      'enter stored value ' +
        quotedSegment(varName) +
        ' into ' +
        quotedSegment(fieldDescription) +
        ' until page contains ' +
        quotedSegment(expectedText),
    );
  }

  enterStoredValueUntilPageContainsStoredValue(
    varName: string,
    fieldDescription: string,
    conditionVarName: string,
  ): TestRigorSteps {
    return this.appendStep(
      'enter stored value ' +
        quotedSegment(varName) +
        ' into ' +
        quotedSegment(fieldDescription) +
        ' until page contains stored value ' +
        quotedSegment(conditionVarName),
    );
  }

  typeKey(keyOrCombo: string): TestRigorSteps {
    return this.appendStep('type ' + TestRigorSteps.rawToken(keyOrCombo));
  }

  typeKeyIfPageContains(keyOrCombo: string, expectedText: string): TestRigorSteps {
    return this.appendStep(
      'type ' +
        TestRigorSteps.rawToken(keyOrCombo) +
        ' if page contains ' +
        quotedSegment(expectedText),
    );
  }

  typeEnter(): TestRigorSteps {
    return this.appendStep('type enter');
  }

  typeTab(): TestRigorSteps {
    return this.appendStep('type tab');
  }

  pressKey(keyOrCombo: string): TestRigorSteps {
    return this.appendStep('press ' + TestRigorSteps.rawToken(keyOrCombo));
  }

  pressKeyIfPageContains(keyOrCombo: string, expectedText: string): TestRigorSteps {
    return this.appendStep(
      'press ' +
        TestRigorSteps.rawToken(keyOrCombo) +
        ' if page contains ' +
        quotedSegment(expectedText),
    );
  }

  saveValue(value: string, varName: string): TestRigorSteps {
    return this.appendStep('save value ' + quotedSegment(value) + ' as ' + quotedSegment(varName));
  }

  grabValueFrom(elementDescription: string, varName: string): TestRigorSteps {
    return this.appendStep(
      'grab value from ' +
        quotedSegment(elementDescription) +
        ' and save it as ' +
        quotedSegment(varName),
    );
  }

  openNewTab(): TestRigorSteps {
    return this.appendStep('open new tab');
  }

  switchToTab(tabIndex: number): TestRigorSteps;
  switchToTab(name: string): TestRigorSteps;
  switchToTab(tabIndexOrName: number | string): TestRigorSteps {
    if (typeof tabIndexOrName === 'number') {
      return this.appendStep('switch to tab ' + tabIndexOrName);
    }
    return this.appendStep('switch to tab ' + quotedSegment(tabIndexOrName));
  }

  closeTab(): TestRigorSteps {
    return this.appendStep('close tab');
  }

  callApi(url: string, varName: string): TestRigorSteps {
    return this.appendStep(
      'call api ' + quotedSegment(url) + ' and save it as ' + quotedSegment(varName),
    );
  }

  paste(): TestRigorSteps {
    return this.appendStep('paste');
  }

  acceptPromptWithValue(value: string): TestRigorSteps {
    return this.appendStep('accept prompt with value ' + quotedSegment(value));
  }

  acceptAlert(): TestRigorSteps {
    return this.appendStep('accept prompt');
  }

  setGeoLocation(latLong: string): TestRigorSteps {
    return this.appendStep('set geo location ' + quotedSegment(latLong));
  }

  setGeoLocationStoredValue(varName: string): TestRigorSteps {
    return this.appendStep('set geo location stored value ' + quotedSegment(varName));
  }
}

export class EnterInto {
  constructor(
    private readonly value: string,
    private readonly parent: TestRigorSteps,
  ) {}

  into(fieldDescription: string): TestRigorSteps {
    return this.parent.stepWith(
      `enter ${quotedSegment(this.value)} into ${quotedSegment(fieldDescription)}`,
    );
  }
}

export class EnterStoredInto {
  constructor(
    private readonly varName: string,
    private readonly parent: TestRigorSteps,
  ) {}

  into(fieldDescription: string): TestRigorSteps {
    return this.parent.stepWith(
      `enter stored value ${quotedSegment(this.varName)} into ${quotedSegment(fieldDescription)}`,
    );
  }
}

export class EnterKeyInto {
  constructor(
    private readonly keyOrCombo: string,
    private readonly parent: TestRigorSteps,
  ) {}

  into(fieldDescription: string): TestRigorSteps {
    return this.parent.stepWith(
      `enter ${TestRigorSteps.rawTokenPublic(this.keyOrCombo)} into ${quotedSegment(fieldDescription)}`,
    );
  }
}

export class EnterTargetInto {
  constructor(
    private readonly value: string,
    private readonly parent: TestRigorSteps,
  ) {}

  into(fieldDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      fieldDescription,
      null,
      null,
      null,
      null,
      null,
      null,
    );
  }
}

export class ClickTarget {
  constructor(
    private readonly parent: TestRigorSteps,
    private readonly elementDescription: string,
    private readonly tableDescription: string | null,
    private readonly rowContainingValue: string | null,
    private readonly columnDescription: string | null,
    private readonly contextDescription: string | null,
    private readonly belowAnchor: Anchor | null,
    private readonly rightAnchor: Anchor | null,
  ) {}

  withinTable(tableDescription: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  rowContaining(rowContaining: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      this.tableDescription,
      rowContaining,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  column(columnDescription: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      this.tableDescription,
      this.rowContainingValue,
      columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  inContext(contextDescription: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  below(anchorDescription: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.below(anchorDescription),
      this.rightAnchor,
    );
  }

  roughlyBelow(anchorDescription: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.roughlyBelow(anchorDescription),
      this.rightAnchor,
    );
  }

  completelyBelow(anchorDescription: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.completelyBelow(anchorDescription),
      this.rightAnchor,
    );
  }

  rightOf(anchorDescription: string): ClickTarget {
    return new ClickTarget(
      this.parent,
      this.elementDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      Anchor.rightOf(anchorDescription),
    );
  }

  and(): ClickTarget {
    return this;
  }

  add(): TestRigorSteps {
    return this.parent.stepWith(
      TestRigorSteps.renderClickLinePublic(
        this.elementDescription,
        this.tableDescription,
        this.rowContainingValue,
        this.columnDescription,
        this.contextDescription,
        this.belowAnchor,
        this.rightAnchor,
      ),
    );
  }
}

export class EnterTarget {
  constructor(
    private readonly parent: TestRigorSteps,
    private readonly value: string,
    private readonly fieldDescription: string,
    private readonly tableDescription: string | null,
    private readonly rowContainingValue: string | null,
    private readonly columnDescription: string | null,
    private readonly contextDescription: string | null,
    private readonly belowAnchor: Anchor | null,
    private readonly rightAnchor: Anchor | null,
  ) {}

  withinTable(tableDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  rowContaining(rowContaining: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      this.tableDescription,
      rowContaining,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  column(columnDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      this.tableDescription,
      this.rowContainingValue,
      columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  inContext(contextDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  below(anchorDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.below(anchorDescription),
      this.rightAnchor,
    );
  }

  roughlyBelow(anchorDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.roughlyBelow(anchorDescription),
      this.rightAnchor,
    );
  }

  completelyBelow(anchorDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.completelyBelow(anchorDescription),
      this.rightAnchor,
    );
  }

  rightOf(anchorDescription: string): EnterTarget {
    return new EnterTarget(
      this.parent,
      this.value,
      this.fieldDescription,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      Anchor.rightOf(anchorDescription),
    );
  }

  and(): EnterTarget {
    return this;
  }

  add(): TestRigorSteps {
    return this.parent.stepWith(
      TestRigorSteps.renderEnterLinePublic(
        this.value,
        this.fieldDescription,
        this.tableDescription,
        this.rowContainingValue,
        this.columnDescription,
        this.contextDescription,
        this.belowAnchor,
        this.rightAnchor,
      ),
    );
  }
}

class Anchor {
  private constructor(
    private readonly relationPrefix: string,
    private readonly anchorDescription: string,
  ) {}

  static below(anchorDescription: string): Anchor {
    return new Anchor('below ', anchorDescription);
  }

  static roughlyBelow(anchorDescription: string): Anchor {
    return new Anchor('roughly below ', anchorDescription);
  }

  static completelyBelow(anchorDescription: string): Anchor {
    return new Anchor('completely below ', anchorDescription);
  }

  static rightOf(anchorDescription: string): Anchor {
    return new Anchor('to the right of ', anchorDescription);
  }

  render(): string {
    return this.relationPrefix + quotedSegment(this.anchorDescription);
  }
}
