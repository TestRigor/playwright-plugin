import { GrpcTransportException } from './GrpcTransportException.js';

export class GrpcNonRetryableTransportException extends GrpcTransportException {
  constructor(
    message: string,
    cause: Error | null | undefined,
    operation: string,
    messageId: string,
    grpcStatusCode: string,
    grpcStatusDescription: string,
  ) {
    super(message, cause, false, operation, messageId, grpcStatusCode, grpcStatusDescription);
    this.name = 'GrpcNonRetryableTransportException';
  }
}
