/**
 * gRPC executeAction names and parameter keys — must match the testRigor extension server.
 */
export class ExtensionGrpcActions {
  static readonly SAVE_LOCATOR_SNAPSHOT = 'saveSeleniumLocator';
  static readonly GET_HEALED_LOCATOR = 'getHealedSeleniumLocator';
  static readonly RECORD_LOCATOR_MAPPING = 'recordSeleniumLocatorMapping';

  static readonly KEY_LOCATOR_TYPE = 'locatorType';
  static readonly KEY_LOCATOR_VALUE = 'locatorValue';

  static readonly KEY_ORIGINAL_LOCATOR_TYPE = 'originalLocatorType';
  static readonly KEY_ORIGINAL_LOCATOR_VALUE = 'originalLocatorValue';
  static readonly KEY_HEALED_LOCATOR_TYPE = 'healedLocatorType';
  static readonly KEY_HEALED_LOCATOR_VALUE = 'healedLocatorValue';

  private constructor() {}
}
