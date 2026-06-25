import { GrpcCode } from './GrpcCode.js';
import { GrpcServerStatusException } from './GrpcServerStatusException.js';

export class GrpcInvalidArgumentException extends GrpcServerStatusException {
  constructor(message: string, reason: string, operation: string, messageId: string) {
    super(message, GrpcCode.INVALID_ARGUMENT, reason, operation, messageId);
    this.name = 'GrpcInvalidArgumentException';
  }
}
