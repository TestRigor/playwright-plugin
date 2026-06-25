import { TestRigorContext } from '../commons/application/context/TestRigorContext.js';
import { DriverCommandValueCodec } from '../commons/application/grpc/DriverCommandValueCodec.js';
import { DriverInfo } from '../commons/application/grpc/DriverInfo.js';
import type {
  ClientMessageWriter,
  GrpcDriverAdapter,
} from '../commons/application/grpc/GrpcDriverAdapter.js';
import { GrpcEndpointConfig } from '../commons/application/grpc/GrpcEndpointConfig.js';
import { TestRigorGrpcClient } from '../commons/application/grpc/TestRigorGrpcClient.js';
import { deserializeJson, serializeJson } from '../commons/application/utils/JsonHelpers.js';
import type { DriverCommandResponse } from '../commons/grpc/testrigor-grpc.js';
import { TestRigorExtensionException } from '../commons/infrastructure/exceptions/TestRigorExtensionException.js';
import { ResolvedElement } from '../elements/resolved-element.js';
import type { PlaywrightBrowserSession } from '../session/playwright-browser-session.js';

export class PlaywrightGrpcConnection implements GrpcDriverAdapter {
  private readonly browserSession: PlaywrightBrowserSession;
  private readonly grpcEndpoint: GrpcEndpointConfig;
  private readonly apiToken: string;
  private client: TestRigorGrpcClient;
  private closed = false;

  constructor(
    browserSession: PlaywrightBrowserSession,
    grpcEndpoint: GrpcEndpointConfig,
    apiToken: string,
  ) {
    this.browserSession = browserSession;
    this.grpcEndpoint = grpcEndpoint;
    this.apiToken = apiToken;
    this.client = new TestRigorGrpcClient(grpcEndpoint, this, apiToken);
  }

  getDriverInfo(testIdOverride?: string | null): DriverInfo {
    const sessionId = this.browserSession.sessionId;
    const capabilityMap = { ...this.browserSession.capabilities };
    const testId =
      testIdOverride != null && testIdOverride.trim() !== ''
        ? testIdOverride
        : TestRigorContext.getTestId();
    const capabilitiesJson = serializeJson(capabilityMap);
    return new DriverInfo(sessionId, capabilitiesJson, testId);
  }

  async executeCommand(
    messageId: string,
    sessionId: string,
    commandName: string,
    parametersJson: string,
    responseWriter: ClientMessageWriter,
  ): Promise<void> {
    const parameters = deserializeJson<Record<string, unknown>>(parametersJson);
    try {
      const response = await this.browserSession.executeCommand(commandName, parameters);
      this.writeCommandResponse(messageId, response, responseWriter);
    } catch (error) {
      console.error(
        `Driver command failed. command=${commandName}, messageId=${messageId}`,
        error instanceof Error ? error.message : String(error),
      );
      this.writeCommandErrorResponse(
        messageId,
        sessionId || this.browserSession.sessionId,
        error,
        responseWriter,
      );
    }
  }

  private writeCommandResponse(
    messageId: string,
    response: { sessionId: string; status: number; state: string; value: unknown },
    responseWriter: ClientMessageWriter,
  ): void {
    const valueJson = response.value == null ? '' : serializeJson(response.value);
    const responseBuilder: DriverCommandResponse = {
      sessionId: response.sessionId ?? '',
      status: response.status,
      state: response.state ?? '',
    };
    DriverCommandValueCodec.setEncodedValue(responseBuilder, valueJson);
    responseWriter.write({
      id: messageId,
      payload: { response: responseBuilder },
    });
  }

  private writeCommandErrorResponse(
    messageId: string,
    sessionId: string,
    error: unknown,
    responseWriter: ClientMessageWriter,
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    const responseBuilder: DriverCommandResponse = {
      sessionId,
      status: 13,
      state: 'unknown error',
    };
    DriverCommandValueCodec.setEncodedValue(
      responseBuilder,
      serializeJson({
        message,
        error: [message],
      }),
    );
    responseWriter.write({
      id: messageId,
      payload: { response: responseBuilder },
    });
  }

  resolveElementFromXpath(xpath: string): Promise<ResolvedElement> {
    return this.browserSession.commandExecutor.resolveElementByXpath(xpath);
  }

  findByUserDescription(description: string): Promise<ResolvedElement> {
    return this.client.findByUserDescription(description).then((obj) => obj as ResolvedElement);
  }

  executePrompt(prompt: string): Promise<void> {
    return this.client.executePrompt(prompt);
  }

  executeAction(
    actionName: string,
    parameters: Record<string, unknown> | null | undefined,
  ): Promise<unknown> {
    const parametersJson = parameters == null ? '' : serializeJson(parameters);
    return this.client.executeAction(actionName, parametersJson);
  }

  reconnect(): void {
    if (this.closed) {
      throw new TestRigorExtensionException('Driver connection already closed');
    }
    console.warn(`Reconnecting gRPC client for session ${this.browserSession.sessionId}`);
    this.safelyCloseClient(this.client);
    this.client = new TestRigorGrpcClient(this.grpcEndpoint, this, this.apiToken);
  }

  isRetryableTransportFailure(throwable: unknown): boolean {
    return TestRigorGrpcClient.isRetryableTransportFailure(throwable);
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.safelyCloseClient(this.client);
    this.client = null!;
  }

  private safelyCloseClient(clientToClose: TestRigorGrpcClient | null | undefined): void {
    if (clientToClose == null) {
      return;
    }
    void clientToClose.close().catch((error) => {
      console.warn(
        `Error closing gRPC client: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }
}
