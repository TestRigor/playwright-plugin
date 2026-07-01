import { GrpcCode } from './GrpcCode.js';
import { GrpcServerStatusException } from './GrpcServerStatusException.js';

export class GrpcInternalException extends GrpcServerStatusException {
  constructor(message: string, reason: string, operation: string, messageId: string) {
    super(message, GrpcCode.INTERNAL, reason, operation, messageId);
    this.name = 'GrpcInternalException';
  }
}
