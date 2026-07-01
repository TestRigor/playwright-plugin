import type { GrpcCode } from './GrpcCode.js';
import { GrpcClientException } from './GrpcClientException.js';

export class GrpcServerStatusException extends GrpcClientException {
  readonly grpcCode: GrpcCode;
  readonly reason: string;
  readonly operation: string;
  readonly messageId: string;

  constructor(
    message: string,
    grpcCode: GrpcCode,
    reason: string,
    operation: string,
    messageId: string,
  ) {
    super(message);
    this.name = 'GrpcServerStatusException';
    this.grpcCode = grpcCode;
    this.reason = reason;
    this.operation = operation;
    this.messageId = messageId;
  }
}
