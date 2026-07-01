import { GrpcClientException } from './GrpcClientException.js';

export class GrpcTransportException extends GrpcClientException {
  readonly retryable: boolean;
  readonly operation: string;
  readonly messageId: string;
  readonly grpcStatusCode: string;
  readonly grpcStatusDescription: string;

  constructor(
    message: string,
    cause: Error | null | undefined,
    retryable: boolean,
    operation: string,
    messageId: string,
    grpcStatusCode: string,
    grpcStatusDescription: string,
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = 'GrpcTransportException';
    this.retryable = retryable;
    this.operation = operation;
    this.messageId = messageId;
    this.grpcStatusCode = grpcStatusCode;
    this.grpcStatusDescription = grpcStatusDescription;
  }
}
