import { GrpcCode } from './GrpcCode.js';
import { GrpcServerStatusException } from './GrpcServerStatusException.js';

export class GrpcNotFoundException extends GrpcServerStatusException {
  constructor(message: string, reason: string, operation: string, messageId: string) {
    super(message, GrpcCode.NOT_FOUND, reason, operation, messageId);
    this.name = 'GrpcNotFoundException';
  }
}
