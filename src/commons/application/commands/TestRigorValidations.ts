import type { TestRigorCommandDriver } from './TestRigorCommandDriver.js';
import { TestRigorSteps } from './TestRigorSteps.js';

export class TestRigorValidations {
  static validations(driver: TestRigorCommandDriver): TestRigorValidations {
    return new TestRigorValidations(driver, TestRigorSteps.create());
  }

  static with(driver: TestRigorCommandDriver): TestRigorValidations {
    return TestRigorValidations.validations(driver);
  }

  private constructor(
    private readonly driver: TestRigorCommandDriver,
    private readonly steps: TestRigorSteps,
  ) {}

  private withSteps(next: TestRigorSteps): TestRigorValidations {
    return new TestRigorValidations(this.driver, next);
  }

  and(): TestRigorValidations {
    return this;
  }

  checkPageContains(text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageContains(text));
  }

  checkPageDoesNotContain(text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageDoesNotContain(text));
  }

  checkPageContainsStoredValue(varName: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageContainsStoredValue(varName));
  }

  checkPageContainsRegex(regex: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageContainsRegex(regex));
  }

  checkPageDoesNotContainRegex(regex: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageDoesNotContainRegex(regex));
  }

  checkPageContainsTemplate(template: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageContainsTemplate(template));
  }

  checkPageDoesNotContainTemplate(template: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageDoesNotContainTemplate(template));
  }

  checkPageDidNotChange(): TestRigorValidations {
    return this.withSteps(this.steps.checkPageDidNotChange());
  }

  checkUrlContains(text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlContains(text));
  }

  checkUrlDoesNotContain(text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlDoesNotContain(text));
  }

  checkUrlStartsWith(prefix: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlStartsWith(prefix));
  }

  checkUrlDoesNotStartWith(prefix: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlDoesNotStartWith(prefix));
  }

  checkUrlEndsWith(suffix: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlEndsWith(suffix));
  }

  checkUrlDoesNotEndWith(suffix: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlDoesNotEndWith(suffix));
  }

  checkUrlIs(url: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlIs(url));
  }

  checkUrlIsNot(url: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlIsNot(url));
  }

  checkUrlMatchesRegex(regex: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlMatchesRegex(regex));
  }

  checkUrlDoesNotMatchRegex(regex: string): TestRigorValidations {
    return this.withSteps(this.steps.checkUrlDoesNotMatchRegex(regex));
  }

  checkPageTitleIs(title: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageTitleIs(title));
  }

  checkPageTitleContains(text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageTitleContains(text));
  }

  checkPageReturnCode(code: string): TestRigorValidations {
    return this.withSteps(this.steps.checkPageReturnCode(code));
  }

  checkButtonDisabled(buttonDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkButtonDisabled(buttonDescription));
  }

  checkButtonEnabled(buttonDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkButtonEnabled(buttonDescription));
  }

  checkThatElementContains(elementDescription: string, text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementContains(elementDescription, text));
  }

  checkThatElementDoesNotContain(elementDescription: string, text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementDoesNotContain(elementDescription, text));
  }

  checkThatElementContainsStoredValue(
    elementDescription: string,
    varName: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementContainsStoredValue(elementDescription, varName),
    );
  }

  checkThatElementDoesNotContainStoredValue(
    elementDescription: string,
    varName: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementDoesNotContainStoredValue(elementDescription, varName),
    );
  }

  checkThatInputHasValue(elementDescription: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatInputHasValue(elementDescription, value));
  }

  checkThatInputHasStoredValue(elementDescription: string, varName: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatInputHasStoredValue(elementDescription, varName));
  }

  checkThatInputDoesNotHaveValue(elementDescription: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatInputDoesNotHaveValue(elementDescription, value));
  }

  checkThatInputDoesNotHaveStoredValue(
    elementDescription: string,
    varName: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatInputDoesNotHaveStoredValue(elementDescription, varName),
    );
  }

  checkThatCheckboxIsChecked(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatCheckboxIsChecked(elementDescription));
  }

  checkThatCheckboxIsUnchecked(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatCheckboxIsUnchecked(elementDescription));
  }

  checkThatElementIsEnabled(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsEnabled(elementDescription));
  }

  checkThatElementIsDisabled(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsDisabled(elementDescription));
  }

  checkThatElementIsVisible(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsVisible(elementDescription));
  }

  checkThatElementIsInvisible(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsInvisible(elementDescription));
  }

  checkThatElementIsClickable(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsClickable(elementDescription));
  }

  checkThatElementIsNotClickable(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsNotClickable(elementDescription));
  }

  checkThatSelectHasOptionSelected(
    elementDescription: string,
    option: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatSelectHasOptionSelected(elementDescription, option));
  }

  checkThatSelectDoesNotHaveOptionSelected(
    elementDescription: string,
    option: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatSelectDoesNotHaveOptionSelected(elementDescription, option),
    );
  }

  checkThatElementMatchesRegex(elementDescription: string, regex: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementMatchesRegex(elementDescription, regex));
  }

  checkThatElementDoesNotMatchRegex(
    elementDescription: string,
    regex: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementDoesNotMatchRegex(elementDescription, regex));
  }

  checkThatElementMatchesTemplate(
    elementDescription: string,
    template: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementMatchesTemplate(elementDescription, template));
  }

  checkThatElementDoesNotMatchTemplate(
    elementDescription: string,
    template: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementDoesNotMatchTemplate(elementDescription, template),
    );
  }

  checkThatElementHasAttribute(
    elementDescription: string,
    attributeName: string,
    expectedValue: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementHasAttribute(elementDescription, attributeName, expectedValue),
    );
  }

  checkThatElementDoesNotHaveAttribute(
    elementDescription: string,
    attributeName: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementDoesNotHaveAttribute(elementDescription, attributeName),
    );
  }

  checkThatElementHasProperty(
    elementDescription: string,
    propertyName: string,
    expectedValue: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementHasProperty(elementDescription, propertyName, expectedValue),
    );
  }

  checkThatElementDoesNotHaveProperty(
    elementDescription: string,
    propertyName: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementDoesNotHaveProperty(elementDescription, propertyName),
    );
  }

  checkThatElementHasCssClass(elementDescription: string, cssClass: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementHasCssClass(elementDescription, cssClass));
  }

  checkThatElementDoesNotHaveCssClass(
    elementDescription: string,
    cssClass: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementDoesNotHaveCssClass(elementDescription, cssClass),
    );
  }

  checkThatElementColorIs(elementDescription: string, color: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementColorIs(elementDescription, color));
  }

  checkThatElementColorIsNot(elementDescription: string, color: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementColorIsNot(elementDescription, color));
  }

  checkThatElementBackgroundColorIs(
    elementDescription: string,
    color: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementBackgroundColorIs(elementDescription, color));
  }

  checkThatElementBackgroundColorIsNot(
    elementDescription: string,
    color: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementBackgroundColorIsNot(elementDescription, color),
    );
  }

  checkThatElementCursorIs(elementDescription: string, cursor: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementCursorIs(elementDescription, cursor));
  }

  checkThatElementCursorIsNot(elementDescription: string, cursor: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementCursorIsNot(elementDescription, cursor));
  }

  checkThatElementHasLineStyle(
    elementDescription: string,
    lineStyle: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementHasLineStyle(elementDescription, lineStyle));
  }

  checkThatElementHasNotLineStyle(
    elementDescription: string,
    lineStyle: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementHasNotLineStyle(elementDescription, lineStyle),
    );
  }

  checkThatElementIsBlank(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsBlank(elementDescription));
  }

  checkThatElementIsNotBlank(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsNotBlank(elementDescription));
  }

  checkThatElementIsNull(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsNull(elementDescription));
  }

  checkThatElementIsNotNull(elementDescription: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsNotNull(elementDescription));
  }

  checkThatElementIsEqual(elementDescription: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsEqual(elementDescription, value));
  }

  checkThatElementIsNotEqual(elementDescription: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsNotEqual(elementDescription, value));
  }

  checkThatElementIsEqualAsNumber(elementDescription: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsEqualAsNumber(elementDescription, value));
  }

  checkThatElementIsNotEqualAsNumber(
    elementDescription: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsNotEqualAsNumber(elementDescription, value));
  }

  checkThatElementIsGreaterThan(elementDescription: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsGreaterThan(elementDescription, value));
  }

  checkThatElementIsGreaterThanOrEqualTo(
    elementDescription: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementIsGreaterThanOrEqualTo(elementDescription, value),
    );
  }

  checkThatElementIsLessThan(elementDescription: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatElementIsLessThan(elementDescription, value));
  }

  checkThatElementIsLessThanOrEqualTo(
    elementDescription: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementIsLessThanOrEqualTo(elementDescription, value),
    );
  }

  checkThatElementIsLexicographicallyBefore(
    elementDescription: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementIsLexicographicallyBefore(elementDescription, value),
    );
  }

  checkThatElementIsLexicographicallyBeforeOrSame(
    elementDescription: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementIsLexicographicallyBeforeOrSame(elementDescription, value),
    );
  }

  checkThatElementIsLexicographicallyAfter(
    elementDescription: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementIsLexicographicallyAfter(elementDescription, value),
    );
  }

  checkThatElementIsLexicographicallyAfterOrSame(
    elementDescription: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatElementIsLexicographicallyAfterOrSame(elementDescription, value),
    );
  }

  checkThatStoredValueItselfContains(varName: string, text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfContains(varName, text));
  }

  checkThatStoredValueItselfDoesNotContain(varName: string, text: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfDoesNotContain(varName, text));
  }

  checkThatStoredValueItselfMatchesRegex(varName: string, regex: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfMatchesRegex(varName, regex));
  }

  checkThatStoredValueItselfDoesNotMatchRegex(
    varName: string,
    regex: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfDoesNotMatchRegex(varName, regex));
  }

  checkThatStoredValueItselfMatchesTemplate(
    varName: string,
    template: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfMatchesTemplate(varName, template));
  }

  checkThatStoredValueItselfDoesNotMatchTemplate(
    varName: string,
    template: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatStoredValueItselfDoesNotMatchTemplate(varName, template),
    );
  }

  checkThatStoredValueItselfIsBlank(varName: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsBlank(varName));
  }

  checkThatStoredValueItselfIsNotBlank(varName: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsNotBlank(varName));
  }

  checkThatStoredValueItselfIsNull(varName: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsNull(varName));
  }

  checkThatStoredValueItselfIsNotNull(varName: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsNotNull(varName));
  }

  checkThatStoredValueItselfIsEqual(varName: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsEqual(varName, value));
  }

  checkThatStoredValueItselfIsNotEqual(varName: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsNotEqual(varName, value));
  }

  checkThatStoredValueItselfIsEqualAsNumber(varName: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsEqualAsNumber(varName, value));
  }

  checkThatStoredValueItselfIsNotEqualAsNumber(
    varName: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsNotEqualAsNumber(varName, value));
  }

  checkThatStoredValueItselfIsGreaterThan(varName: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsGreaterThan(varName, value));
  }

  checkThatStoredValueItselfIsGreaterThanOrEqualTo(
    varName: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(
      this.steps.checkThatStoredValueItselfIsGreaterThanOrEqualTo(varName, value),
    );
  }

  checkThatStoredValueItselfIsLessThan(varName: string, value: string): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsLessThan(varName, value));
  }

  checkThatStoredValueItselfIsLessThanOrEqualTo(
    varName: string,
    value: string,
  ): TestRigorValidations {
    return this.withSteps(this.steps.checkThatStoredValueItselfIsLessThanOrEqualTo(varName, value));
  }

  async execute(): Promise<void> {
    await this.driver.executePrompt(this.steps.build());
  }

  buildPrompt(): string {
    return this.steps.build();
  }
}
