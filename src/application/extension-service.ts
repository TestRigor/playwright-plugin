import { AssertionError } from 'node:assert';
import { TestRigorContext } from '../commons/application/context/TestRigorContext.js';
import { GrpcEndpointConfig } from '../commons/application/grpc/GrpcEndpointConfig.js';
import { ExtensionGrpcActions } from '../commons/application/grpc/ExtensionGrpcActions.js';
import { deserializeJson } from '../commons/application/utils/JsonHelpers.js';
import { Action } from '../commons/domain/model/Action.js';
import { Locator } from '../commons/domain/model/Locator.js';
import { locatorTypeFromName } from '../commons/domain/model/LocatorType.js';
import { GrpcNotFoundException } from '../commons/infrastructure/exceptions/GrpcNotFoundException.js';
import { GrpcTransportException } from '../commons/infrastructure/exceptions/GrpcTransportException.js';
import { TestRigorExtensionException } from '../commons/infrastructure/exceptions/TestRigorExtensionException.js';
import { ResolvedElement } from '../elements/resolved-element.js';
import type { PlaywrightBrowserSession } from '../session/playwright-browser-session.js';
import { PlaywrightGrpcConnection } from './grpc-connection.js';

export class PlaywrightExtensionService {
  readonly browserSession: PlaywrightBrowserSession;
  private readonly apiToken: string;
  private readonly grpcEndpoint: GrpcEndpointConfig;
  private grpcConnection: PlaywrightGrpcConnection | null = null;
  private connectionClosed = false;
  private lockTail: Promise<void> = Promise.resolve();

  constructor(
    browserSession: PlaywrightBrowserSession,
    apiToken: string,
    grpcEndpoint: GrpcEndpointConfig,
  ) {
    this.browserSession = browserSession;
    this.apiToken = apiToken;
    this.grpcEndpoint = grpcEndpoint;
  }

  setTestContext(testId: string): void {
    TestRigorContext.setTestContext(testId);
  }

  clearTestContext(): void {
    TestRigorContext.clearTestContext();
  }

  async saveAction(action: Action): Promise<void> {
    PlaywrightExtensionService.requireTestIdForLocatorHealing();
    const loc = action.locator;
    const params = PlaywrightExtensionService.locatorParams(loc);
    try {
      await this.executeWithReconnectRetry(
        `executeAction:${ExtensionGrpcActions.SAVE_LOCATOR_SNAPSHOT}`,
        async () => {
          await this.getOrCreateConnection().executeAction(
            ExtensionGrpcActions.SAVE_LOCATOR_SNAPSHOT,
            params,
          );
        },
      );
    } catch (error) {
      console.warn(
        `saveLocatorSnapshot failed: ${PlaywrightExtensionService.rootCauseMessage(error)}`,
      );
    }
  }

  async getHealedLocator(locator: Locator): Promise<Locator | null> {
    PlaywrightExtensionService.requireTestIdForLocatorHealing();
    const params = PlaywrightExtensionService.locatorParams(locator);
    try {
      const result = await this.executeWithReconnectRetry(
        `executeAction:${ExtensionGrpcActions.GET_HEALED_LOCATOR}`,
        () =>
          this.getOrCreateConnection().executeAction(
            ExtensionGrpcActions.GET_HEALED_LOCATOR,
            params,
          ),
      );
      if (typeof result !== 'string') {
        return null;
      }
      const map = deserializeJson<Record<string, unknown>>(result);
      return new Locator(
        locatorTypeFromName(String(map[ExtensionGrpcActions.KEY_LOCATOR_TYPE])),
        String(map[ExtensionGrpcActions.KEY_LOCATOR_VALUE]),
      );
    } catch (error) {
      if (PlaywrightExtensionService.containsGrpcNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async recordHealedFind(original: Locator, healed: Locator): Promise<void> {
    PlaywrightExtensionService.requireTestIdForLocatorHealing();
    const params: Record<string, unknown> = {
      [ExtensionGrpcActions.KEY_ORIGINAL_LOCATOR_TYPE]: original.type,
      [ExtensionGrpcActions.KEY_ORIGINAL_LOCATOR_VALUE]: original.value,
      [ExtensionGrpcActions.KEY_HEALED_LOCATOR_TYPE]: healed.type,
      [ExtensionGrpcActions.KEY_HEALED_LOCATOR_VALUE]: healed.value,
    };
    try {
      await this.executeWithReconnectRetry(
        `executeAction:${ExtensionGrpcActions.RECORD_LOCATOR_MAPPING}`,
        async () => {
          await this.getOrCreateConnection().executeAction(
            ExtensionGrpcActions.RECORD_LOCATOR_MAPPING,
            params,
          );
        },
      );
    } catch (error) {
      console.debug(
        `recordLocatorMapping failed: ${PlaywrightExtensionService.rootCauseMessage(error)}`,
      );
    }
  }

  async findResolvedByUserDescription(description: string): Promise<ResolvedElement> {
    return this.executeWithReconnectRetry('findByUserDescription', () =>
      this.getOrCreateConnection().findByUserDescription(description),
    );
  }

  async executePrompt(prompt: string): Promise<void> {
    await this.executeWithReconnectRetry('executePrompt', async () => {
      await this.getOrCreateConnection().executePrompt(prompt);
    });
  }

  async executeAction(actionName: string, parameters: Record<string, unknown>): Promise<unknown> {
    return this.executeActionInternal(actionName, parameters, false);
  }

  async click(elementDescription: string): Promise<void> {
    await this.executeAction(
      'click',
      PlaywrightExtensionService.singleParameter('elementDescription', elementDescription),
    );
  }

  async checkPageContains(text: string): Promise<void> {
    try {
      await this.executeActionInternal(
        'checkPageContains',
        PlaywrightExtensionService.singleParameter('text', text),
        true,
      );
    } catch (error) {
      if (error instanceof TestRigorExtensionException) {
        throw PlaywrightExtensionService.toAssertionError(error);
      }
      throw error;
    }
  }

  async grabValue(elementDescription: string): Promise<string> {
    const result = await this.executeAction(
      'grabValue',
      PlaywrightExtensionService.singleParameter('elementDescription', elementDescription),
    );
    return result == null ? '' : String(result);
  }

  async closeConnection(): Promise<void> {
    await this.withLock(async () => {
      if (this.grpcConnection != null) {
        try {
          await this.grpcConnection.close();
        } catch (error) {
          console.warn(
            `Error closing gRPC connection: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        this.grpcConnection = null;
      }
      this.connectionClosed = true;
    });
  }

  private async executeActionInternal(
    actionName: string,
    parameters: Record<string, unknown>,
    validationCommand: boolean,
  ): Promise<unknown> {
    try {
      return await this.executeWithReconnectRetry(`executeAction:${actionName}`, () =>
        this.getOrCreateConnection().executeAction(actionName, parameters),
      );
    } catch (error) {
      if (validationCommand && error instanceof TestRigorExtensionException) {
        throw PlaywrightExtensionService.toAssertionError(error);
      }
      if (error instanceof TestRigorExtensionException) {
        throw error;
      }
      throw new TestRigorExtensionException(`Failed to execute action ${actionName}`, {
        cause: error,
      });
    }
  }

  private getOrCreateConnection(): PlaywrightGrpcConnection {
    if (this.connectionClosed) {
      throw new TestRigorExtensionException('Driver connection already closed');
    }
    if (this.grpcConnection == null) {
      this.grpcConnection = new PlaywrightGrpcConnection(
        this.browserSession,
        this.grpcEndpoint,
        this.apiToken,
      );
    }
    return this.grpcConnection;
  }

  private async executeWithReconnectRetry<T>(
    operation: string,
    operationSupplier: () => Promise<T>,
  ): Promise<T> {
    let attempt = 1;
    while (true) {
      try {
        return await this.withLock(operationSupplier);
      } catch (error) {
        const cause = PlaywrightExtensionService.unwrapCompletionException(error);
        if (attempt === 1 && this.shouldReconnectAndRetry(cause)) {
          console.warn(
            `Retrying operation after gRPC reconnect. operation=${operation}, retryableCause=${
              cause == null ? 'unknown' : cause.constructor.name
            }`,
            cause,
          );
          await this.reconnectGrpcClient(cause);
          attempt++;
          continue;
        }
        throw this.toExtensionException(cause ?? error, operation);
      }
    }
  }

  private async reconnectGrpcClient(cause: unknown): Promise<void> {
    await this.withLock(async () => {
      if (this.connectionClosed) {
        throw new TestRigorExtensionException('Driver connection already closed', { cause });
      }
      this.getOrCreateConnection().reconnect();
    });
  }

  private shouldReconnectAndRetry(cause: unknown): boolean {
    if (cause == null || this.connectionClosed) {
      return false;
    }
    if (cause instanceof GrpcTransportException) {
      return cause.retryable;
    }
    if (this.grpcConnection == null) {
      return false;
    }
    return this.grpcConnection.isRetryableTransportFailure(cause);
  }

  private toExtensionException(cause: unknown, operation: string): TestRigorExtensionException {
    if (cause instanceof TestRigorExtensionException) {
      return cause;
    }
    return new TestRigorExtensionException(`Failed to execute ${operation}`, { cause });
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.lockTail;
    let releaseLock!: () => void;
    this.lockTail = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      releaseLock();
    }
  }

  private static requireTestIdForLocatorHealing(): void {
    const testId = TestRigorContext.getTestId();
    if (testId == null || testId.trim() === '') {
      throw new Error('testId is required for locator healing');
    }
  }

  private static locatorParams(loc: Locator): Record<string, unknown> {
    return {
      [ExtensionGrpcActions.KEY_LOCATOR_TYPE]: loc.type,
      [ExtensionGrpcActions.KEY_LOCATOR_VALUE]: loc.value,
    };
  }

  private static singleParameter(key: string, value: string): Record<string, unknown> {
    return { [key]: value };
  }

  private static containsGrpcNotFound(error: unknown): boolean {
    let current: unknown = error;
    while (current != null) {
      if (current instanceof GrpcNotFoundException) {
        return true;
      }
      if (current instanceof Error && current.cause) {
        current = current.cause;
      } else {
        break;
      }
    }
    return false;
  }

  private static rootCauseMessage(error: unknown): string {
    let current: unknown = error;
    while (current instanceof Error && current.cause) {
      current = current.cause;
    }
    if (current instanceof Error) {
      return current.message || current.constructor.name;
    }
    return String(current);
  }

  private static toAssertionError(error: TestRigorExtensionException): AssertionError {
    const assertion = new AssertionError({ message: error.message });
    assertion.cause = error;
    return assertion;
  }

  private static unwrapCompletionException(throwable: unknown): unknown {
    if (throwable instanceof Error && throwable.name === 'CompletionException' && throwable.cause) {
      return throwable.cause;
    }
    return throwable;
  }
}
