import { GrpcNonRetryableTransportException } from './GrpcNonRetryableTransportException.js';

export class GrpcStreamClosedException extends GrpcNonRetryableTransportException {
  constructor(message: string, operation: string, messageId: string) {
    super(message, null, operation, messageId, 'UNKNOWN', 'stream completed');
    this.name = 'GrpcStreamClosedException';
  }
}
