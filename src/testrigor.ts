import type { Page } from 'playwright';
import { TestRigorActions } from './commons/application/commands/TestRigorActions.js';
import { TestRigorQueries } from './commons/application/commands/TestRigorQueries.js';
import { TestRigorValidations } from './commons/application/commands/TestRigorValidations.js';
import type { TestRigorCommandDriver } from './commons/application/commands/TestRigorCommandDriver.js';
import { GrpcEndpointConfig } from './commons/application/grpc/GrpcEndpointConfig.js';
import { PlaywrightExtensionService } from './application/extension-service.js';
import { TestrigorPlaywrightDriver } from './application/playwright-driver.js';
import { loadDefaultConfig, toLaunchConfig, type PlaywrightPluginConfig } from './config.js';
import { PlaywrightLocator } from './locators/playwright-locator.js';
import { PlaywrightSession } from './session/playwright-session.js';

export class TestRigor {
  private constructor() {}

  static extendPage(page: Page, apiToken: string): TestrigorPlaywrightDriver;
  static extendPage(
    page: Page,
    apiToken: string,
    grpcEndpoint: GrpcEndpointConfig,
  ): TestrigorPlaywrightDriver;
  static extendPage(
    page: Page,
    apiToken: string,
    grpcEndpoint?: GrpcEndpointConfig,
  ): TestrigorPlaywrightDriver {
    const session = PlaywrightSession.wrap(page);
    return TestRigor.extendSession(
      session,
      apiToken,
      grpcEndpoint ?? GrpcEndpointConfig.fromConfig(loadDefaultConfig()),
    );
  }

  static async createBrowserPage(
    config: PlaywrightPluginConfig,
    apiToken: string,
  ): Promise<TestrigorPlaywrightDriver>;
  static async createBrowserPage(
    config: PlaywrightPluginConfig,
    apiToken: string,
    grpcEndpoint: GrpcEndpointConfig,
  ): Promise<TestrigorPlaywrightDriver>;
  static async createBrowserPage(apiToken: string): Promise<TestrigorPlaywrightDriver>;
  static async createBrowserPage(
    configOrApiToken: PlaywrightPluginConfig | string,
    apiToken?: string,
    grpcEndpoint?: GrpcEndpointConfig,
  ): Promise<TestrigorPlaywrightDriver> {
    if (typeof configOrApiToken === 'string') {
      return TestRigor.createBrowserPage(loadDefaultConfig(), configOrApiToken);
    }
    const session = await PlaywrightSession.launch(toLaunchConfig(configOrApiToken));
    return TestRigor.extendSession(
      session,
      apiToken!,
      grpcEndpoint ?? GrpcEndpointConfig.fromConfig(configOrApiToken),
    );
  }

  static byUserDescription(description: string): PlaywrightLocator {
    return PlaywrightLocator.byUserDescription(description);
  }

  static actions(driver: TestRigorCommandDriver): TestRigorActions {
    return TestRigorActions.actions(driver);
  }

  static validations(driver: TestRigorCommandDriver): TestRigorValidations {
    return TestRigorValidations.validations(driver);
  }

  static queries(driver: TestRigorCommandDriver): TestRigorQueries {
    return TestRigorQueries.queries(driver);
  }

  static extendSession(session: PlaywrightSession, apiToken: string): TestrigorPlaywrightDriver;
  static extendSession(
    session: PlaywrightSession,
    apiToken: string,
    grpcEndpoint: GrpcEndpointConfig,
  ): TestrigorPlaywrightDriver;
  static extendSession(
    session: PlaywrightSession,
    apiToken: string,
    grpcEndpoint?: GrpcEndpointConfig,
  ): TestrigorPlaywrightDriver {
    const extensionService = new PlaywrightExtensionService(
      session.browserSession,
      apiToken,
      grpcEndpoint ?? GrpcEndpointConfig.fromConfig(loadDefaultConfig()),
    );
    return new TestrigorPlaywrightDriver(session, extensionService);
  }
}
