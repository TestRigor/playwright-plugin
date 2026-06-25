import { randomUUID } from 'node:crypto';
import * as grpc from '@grpc/grpc-js';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { TestRigorContext } from '../context/TestRigorContext.js';
import { GrpcActionExecutionException } from '../../infrastructure/exceptions/GrpcActionExecutionException.js';
import { GrpcInternalException } from '../../infrastructure/exceptions/GrpcInternalException.js';
import { GrpcInvalidArgumentException } from '../../infrastructure/exceptions/GrpcInvalidArgumentException.js';
import { GrpcIssuesDetectedException } from '../../infrastructure/exceptions/GrpcIssuesDetectedException.js';
import { GrpcMissingActionPayloadException } from '../../infrastructure/exceptions/GrpcMissingActionPayloadException.js';
import { GrpcNonRetryableTransportException } from '../../infrastructure/exceptions/GrpcNonRetryableTransportException.js';
import { GrpcNotFoundException } from '../../infrastructure/exceptions/GrpcNotFoundException.js';
import { GrpcRetryableTransportException } from '../../infrastructure/exceptions/GrpcRetryableTransportException.js';
import { GrpcServerStatusException } from '../../infrastructure/exceptions/GrpcServerStatusException.js';
import { GrpcStreamClosedException } from '../../infrastructure/exceptions/GrpcStreamClosedException.js';
import { GrpcUnsupportedActionException } from '../../infrastructure/exceptions/GrpcUnsupportedActionException.js';
import { GrpcCode, grpcCodeFromNumber } from '../../infrastructure/exceptions/GrpcCode.js';
import type { TestRigorExtensionException } from '../../infrastructure/exceptions/TestRigorExtensionException.js';
import {
  createTestRigorServiceClient,
  type ClientMessage,
  type ServerMessage,
  type TestRigorServiceClient,
} from '../../grpc/testrigor-grpc.js';
import type { GrpcDriverAdapter, ClientMessageWriter } from './GrpcDriverAdapter.js';
import type { DriverInfo } from './DriverInfo.js';
import { GrpcEndpointConfig } from './GrpcEndpointConfig.js';

const API_TOKEN_KEY = 'api-token';

type PendingFuture = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export class TestRigorGrpcClient implements AsyncDisposable {
  private readonly client: TestRigorServiceClient;
  private readonly futures = new Map<string, PendingFuture>();
  private readonly adapter: GrpcDriverAdapter;
  private readonly apiToken: string;
  private clientMessageStream: grpc.ClientDuplexStream<ClientMessage, ServerMessage> | null = null;
  private clientStreamClosed = true;
  private firstFailureLogged = false;
  private activeOperation = 'unknown';
  private activeMessageId = '';
  private activeDriverInfo: DriverInfo | null = null;

  constructor(endpoint: GrpcEndpointConfig, adapter: GrpcDriverAdapter, apiToken: string) {
    this.adapter = adapter;
    this.apiToken = TestRigorGrpcClient.normalizeToken(apiToken);
    const address = `${endpoint.host}:${endpoint.port}`;
    const credentials = endpoint.useTransportSecurity()
      ? grpc.credentials.createSsl()
      : grpc.credentials.createInsecure();
    this.client = createTestRigorServiceClient(address, credentials);
  }

  static normalizeToken(token: string | null | undefined): string {
    return token == null ? '' : token.trim();
  }

  processServerMessage(serverMessage: ServerMessage): void {
    const messageCase = resolveServerMessageCase(serverMessage);
    if (messageCase === 'command') {
      const command = serverMessage.command!;
      const commandName = command.payload?.name ?? '';
      const writer: ClientMessageWriter = {
        write: (message) => this.clientMessageStream?.write(message),
      };
      void Promise.resolve(
        this.adapter.executeCommand(
          serverMessage.id ?? '',
          command.sessionId ?? '',
          commandName,
          command.payload?.parametersJson ?? '',
          writer,
        ),
      ).catch((error: unknown) => {
        console.error(
          `Driver command failed. command=${commandName}, messageId=${serverMessage.id ?? ''}`,
          error,
        );
      });
      return;
    }

    if (messageCase === 'result') {
      this.processResult(serverMessage);
      return;
    }

    if (messageCase === 'status') {
      this.processStatus(serverMessage);
    }
  }

  private processStatus(serverMessage: ServerMessage): void {
    const status = serverMessage.status!;
    let errorMessage = status.message ?? '';
    let reason = '';
    for (const detail of status.details ?? []) {
      if (!detail.type_url?.endsWith('/google.rpc.ErrorInfo')) {
        continue;
      }
      try {
        const decoded = detail.value?.toString('utf8') ?? '';
        const reasonMatch = decoded.match(/reason[\s\S]*?([A-Za-z][\w\s]+)/);
        if (reasonMatch?.[1]) {
          reason = reasonMatch[1].trim();
        }
        if (!errorMessage.trim() && reason) {
          errorMessage = reason;
        }
      } catch {
        // Ignore unpack failures due to runtime/protobuf skew.
      }
    }

    const future = this.futures.get(serverMessage.id ?? '');
    if (future) {
      this.futures.delete(serverMessage.id ?? '');
      future.reject(
        this.toServerStatusException(
          status,
          errorMessage,
          reason,
          serverMessage.id ?? '',
          this.activeOperation,
        ),
      );
    }
  }

  private processResult(serverMessage: ServerMessage): void {
    const future = this.futures.get(serverMessage.id ?? '');
    if (!future) {
      return;
    }
    this.futures.delete(serverMessage.id ?? '');

    const result = serverMessage.result!;
    if (result.elementXpath != null && result.elementXpath !== '') {
      Promise.resolve(this.adapter.resolveElementFromXpath(result.elementXpath))
        .then((element) => future.resolve(element))
        .catch((e) => future.reject(e));
      return;
    }
    if (result.stringValue != null) {
      future.resolve(result.stringValue);
      return;
    }
    if (result.boolValue != null) {
      future.resolve(result.boolValue);
      return;
    }
    if (result.jsonValue != null) {
      future.resolve(result.jsonValue);
      return;
    }
    if (result.value != null && result.value !== '') {
      Promise.resolve(this.adapter.resolveElementFromXpath(result.value))
        .then((element) => future.resolve(element))
        .catch((e) => future.reject(e));
      return;
    }
    future.resolve(undefined);
  }

  findByUserDescription(description: string): Promise<unknown> {
    const messageId = randomUUID();
    const promise = new Promise<unknown>((resolve, reject) => {
      this.futures.set(messageId, { resolve, reject });
    });
    this.activeOperation = 'findElement';
    this.activeMessageId = messageId;
    this.activeDriverInfo = null;
    this.firstFailureLogged = false;
    this.clientMessageStream = this.client.findElement(this.createAuthMetadata());
    this.clientStreamClosed = false;
    this.attachStreamHandlers(this.clientMessageStream);

    const capturedTestId = TestRigorContext.getTestId();
    setImmediate(() => {
      void (async () => {
        try {
          const info = await this.adapter.getDriverInfo(capturedTestId);
          this.activeDriverInfo = info;
          this.logSendStart(messageId, info);
          const clientMessage: ClientMessage = {
            id: messageId,
            payload: {
              driver: this.buildDriver(info),
              message: description,
            },
          };
          this.clientMessageStream?.write(clientMessage);
        } catch (e) {
          this.abortClientStream(e);
        }
      })();
    });

    return promise;
  }

  executePrompt(prompt: string): Promise<void> {
    const messageId = randomUUID();
    const promise = new Promise<void>((resolve, reject) => {
      this.futures.set(messageId, { resolve: () => resolve(), reject });
    });
    this.activeOperation = 'executePrompt';
    this.activeMessageId = messageId;
    this.activeDriverInfo = null;
    this.firstFailureLogged = false;
    this.clientMessageStream = this.client.executePrompt(this.createAuthMetadata());
    this.clientStreamClosed = false;
    this.attachStreamHandlers(this.clientMessageStream);

    const capturedTestId = TestRigorContext.getTestId();
    setImmediate(() => {
      void (async () => {
        try {
          const info = await this.adapter.getDriverInfo(capturedTestId);
          this.activeDriverInfo = info;
          this.logSendStart(messageId, info);
          const clientMessage: ClientMessage = {
            id: messageId,
            payload: {
              driver: this.buildDriver(info),
              message: prompt,
            },
          };
          this.clientMessageStream?.write(clientMessage);
        } catch (e) {
          this.abortClientStream(e);
        }
      })();
    });

    return promise;
  }

  executeAction(actionName: string, parametersJson: string | null | undefined): Promise<unknown> {
    const messageId = randomUUID();
    const promise = new Promise<unknown>((resolve, reject) => {
      this.futures.set(messageId, { resolve, reject });
    });
    this.activeOperation = 'executeAction';
    this.activeMessageId = messageId;
    this.activeDriverInfo = null;
    this.firstFailureLogged = false;
    this.clientMessageStream = this.client.executeAction(this.createAuthMetadata());
    this.clientStreamClosed = false;
    this.attachStreamHandlers(this.clientMessageStream);

    const capturedTestId = TestRigorContext.getTestId();
    setImmediate(() => {
      void (async () => {
        try {
          const info = await this.adapter.getDriverInfo(capturedTestId);
          this.activeDriverInfo = info;
          this.logSendStart(messageId, info);
          const clientMessage: ClientMessage = {
            id: messageId,
            payload: {
              driver: this.buildDriver(info),
              action: {
                name: actionName,
                parametersJson: parametersJson ?? '',
              },
            },
          };
          this.clientMessageStream?.write(clientMessage);
        } catch (e) {
          this.abortClientStream(e);
        }
      })();
    });

    return promise;
  }

  async close(): Promise<void> {
    this.completeClientStream();
    this.client.close();
    await new Promise<void>((resolve) => {
      const deadline = Date.now() + 5000;
      this.client.waitForReady(deadline, (err) => {
        if (err) {
          this.client.getChannel().getConnectivityState(true);
        }
        resolve();
      });
    });
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }

  private createAuthMetadata(): grpc.Metadata | undefined {
    if (!this.apiToken) {
      return undefined;
    }
    const metadata = new grpc.Metadata();
    metadata.set(API_TOKEN_KEY, this.apiToken);
    return metadata;
  }

  private attachStreamHandlers(
    stream: grpc.ClientDuplexStream<ClientMessage, ServerMessage>,
  ): void {
    stream.on('data', (serverMessage) => this.processServerMessage(serverMessage));
    stream.on('error', (throwable) => this.handleStreamFailure(throwable));
    stream.on('end', () => {
      this.clientStreamClosed = true;
      const failure = new GrpcStreamClosedException(
        'gRPC stream completed before all responses were received',
        this.activeOperation,
        this.activeMessageId,
      );
      this.failAllPendingFutures(failure);
    });
  }

  private handleStreamFailure(throwable: unknown): void {
    this.clientStreamClosed = true;
    const root =
      throwable == null
        ? new Error('Unknown gRPC stream failure')
        : throwable instanceof Error
          ? throwable
          : new Error(String(throwable));
    const retryable = TestRigorGrpcClient.isRetryableTransportFailure(root);
    this.logStreamFailure(root, retryable);
    this.failAllPendingFutures(this.toTransportException(root, retryable));
  }

  private failAllPendingFutures(throwable: unknown): void {
    if (this.futures.size === 0) {
      return;
    }
    for (const future of this.futures.values()) {
      future.reject(throwable);
    }
    this.futures.clear();
  }

  private logStreamFailure(throwable: Error, retryable: boolean): void {
    const statusCode = TestRigorGrpcClient.grpcStatusCode(throwable);
    const description = TestRigorGrpcClient.grpcStatusDescription(throwable);
    const context = this.streamContext();
    if (!this.firstFailureLogged) {
      this.firstFailureLogged = true;
      console.error(
        `gRPC stream failure. operation=${this.activeOperation}, messageId=${this.activeMessageId}, status=${statusCode}, retryable=${retryable}, description='${description ?? ''}'${context}`,
        throwable,
      );
      return;
    }
    console.debug(
      `gRPC stream failure (suppressed duplicate). operation=${this.activeOperation}, messageId=${this.activeMessageId}, status=${statusCode}, retryable=${retryable}, description='${description ?? ''}'${context}`,
    );
  }

  private logSendStart(messageId: string, info: DriverInfo | null): void {
    console.debug(
      `Sending gRPC request. operation=${this.activeOperation}, messageId=${messageId}, sessionId=${info?.sessionId ?? ''}, testId=${info?.testId ?? ''}`,
    );
  }

  private buildFailureMessage(throwable: Error, retryable: boolean): string {
    return `gRPC stream failed. operation=${this.activeOperation}, messageId=${this.activeMessageId}, status=${TestRigorGrpcClient.grpcStatusCode(throwable)}, retryable=${retryable}, description=${TestRigorGrpcClient.grpcStatusDescription(throwable)}`;
  }

  private toTransportException(throwable: Error, retryable: boolean): TestRigorExtensionException {
    const statusCode = TestRigorGrpcClient.grpcStatusCode(throwable);
    const statusDescription = TestRigorGrpcClient.grpcStatusDescription(throwable);
    const message = this.buildFailureMessage(throwable, retryable);
    if (retryable) {
      return new GrpcRetryableTransportException(
        message,
        throwable,
        this.activeOperation,
        this.activeMessageId,
        statusCode,
        statusDescription,
      );
    }
    return new GrpcNonRetryableTransportException(
      message,
      throwable,
      this.activeOperation,
      this.activeMessageId,
      statusCode,
      statusDescription,
    );
  }

  private toServerStatusException(
    status: { code?: number; message?: string },
    errorMessage: string,
    reason: string,
    messageId: string,
    operation: string,
  ): GrpcServerStatusException {
    const code = grpcCodeFromNumber(status.code ?? GrpcCode.UNKNOWN);
    const safeMessage = errorMessage ?? '';
    const safeReason = reason ?? '';
    switch (code) {
      case GrpcCode.INVALID_ARGUMENT:
        if (matchesReason(safeReason, 'Unsupported action')) {
          return new GrpcUnsupportedActionException(safeMessage, safeReason, operation, messageId);
        }
        if (matchesReason(safeReason, 'Missing action payload')) {
          return new GrpcMissingActionPayloadException(
            safeMessage,
            safeReason,
            operation,
            messageId,
          );
        }
        return new GrpcInvalidArgumentException(safeMessage, safeReason, operation, messageId);
      case GrpcCode.NOT_FOUND:
        return new GrpcNotFoundException(safeMessage, safeReason, operation, messageId);
      case GrpcCode.INTERNAL:
        if (matchesReason(safeReason, 'Issues detected')) {
          return new GrpcIssuesDetectedException(safeMessage, safeReason, operation, messageId);
        }
        if (matchesReason(safeReason, 'Error when processing action')) {
          return new GrpcActionExecutionException(safeMessage, safeReason, operation, messageId);
        }
        return new GrpcInternalException(safeMessage, safeReason, operation, messageId);
      default:
        return new GrpcServerStatusException(safeMessage, code, safeReason, operation, messageId);
    }
  }

  private streamContext(): string {
    const info = this.activeDriverInfo;
    if (!info) {
      return '';
    }
    return `, sessionId=${info.sessionId ?? ''}, testId=${info.testId ?? ''}`;
  }

  static grpcStatusCode(throwable: unknown): string {
    const serviceError = findCause(throwable, isServiceError);
    if (!serviceError) {
      return 'UNKNOWN';
    }
    return GrpcStatus[serviceError.code] ?? 'UNKNOWN';
  }

  static grpcStatusDescription(throwable: unknown): string {
    const serviceError = findCause(throwable, isServiceError);
    if (!serviceError) {
      return throwable instanceof Error ? String(throwable.message) : String(throwable);
    }
    return serviceError.details ?? '';
  }

  static isRetryableTransportFailure(throwable: unknown): boolean {
    const serviceError = findCause(throwable, isServiceError);
    if (!serviceError) {
      return false;
    }

    const statusCode = serviceError.code;
    if (statusCode === GrpcStatus.CANCELLED || statusCode === GrpcStatus.UNAVAILABLE) {
      return true;
    }
    if (statusCode !== GrpcStatus.INTERNAL) {
      return false;
    }

    const description = serviceError.details;
    if (!description) {
      return false;
    }
    const normalized = description.toLowerCase();
    return (
      normalized.includes('rst_stream') ||
      normalized.includes('http/2 error code: cancel') ||
      normalized.includes('stream closed') ||
      normalized.includes('channel shutdown') ||
      normalized.includes('call already cancelled') ||
      normalized.includes('client cancelled')
    );
  }

  private completeClientStream(): void {
    const observer = this.clientMessageStream;
    if (!observer || this.clientStreamClosed) {
      return;
    }
    this.clientStreamClosed = true;
    try {
      observer.end();
    } catch {
      // Client stream already half-closed.
    }
  }

  private abortClientStream(throwable: unknown): void {
    const observer = this.clientMessageStream;
    if (!observer || this.clientStreamClosed) {
      return;
    }
    this.clientStreamClosed = true;
    try {
      observer.destroy(throwable instanceof Error ? throwable : new Error(String(throwable)));
    } catch {
      // Client stream already closed while aborting.
    }
  }

  private buildDriver(info: DriverInfo): NonNullable<ClientMessage['payload']>['driver'] {
    const driver: NonNullable<ClientMessage['payload']>['driver'] = {
      sessionId: info.sessionId,
      capabilitiesJson: info.capabilitiesJson,
    };
    if (info.testId != null && info.testId.trim() !== '') {
      driver.testId = info.testId;
    }
    return driver;
  }
}

function matchesReason(actualReason: string, expectedReason: string): boolean {
  return actualReason != null && actualReason.toLowerCase() === expectedReason.toLowerCase();
}

function resolveServerMessageCase(
  serverMessage: ServerMessage,
): 'command' | 'result' | 'status' | undefined {
  const explicit = (serverMessage as ServerMessage & { message?: string }).message;
  if (explicit === 'command' || explicit === 'result' || explicit === 'status') {
    return explicit;
  }
  if (serverMessage.status != null) {
    return 'status';
  }
  if (serverMessage.result != null) {
    return 'result';
  }
  if (serverMessage.command != null) {
    return 'command';
  }
  return undefined;
}

function isServiceError(value: unknown): value is grpc.ServiceError {
  return (
    typeof value === 'object' &&
    value != null &&
    'code' in value &&
    typeof (value as grpc.ServiceError).code === 'number'
  );
}

function findCause<T>(throwable: unknown, predicate: (value: unknown) => value is T): T | null {
  let current: unknown = throwable;
  while (current != null) {
    if (predicate(current)) {
      return current;
    }
    if (current instanceof Error && current.cause) {
      current = current.cause;
    } else {
      break;
    }
  }
  return null;
}
