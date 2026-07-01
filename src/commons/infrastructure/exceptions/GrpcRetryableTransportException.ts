import { GrpcTransportException } from './GrpcTransportException.js';

export class GrpcRetryableTransportException extends GrpcTransportException {
  constructor(
    message: string,
    cause: Error | null | undefined,
    operation: string,
    messageId: string,
    grpcStatusCode: string,
    grpcStatusDescription: string,
  ) {
    super(message, cause, true, operation, messageId, grpcStatusCode, grpcStatusDescription);
    this.name = 'GrpcRetryableTransportException';
  }
}
