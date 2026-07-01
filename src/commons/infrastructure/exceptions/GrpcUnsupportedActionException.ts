import { GrpcInvalidArgumentException } from './GrpcInvalidArgumentException.js';

export class GrpcUnsupportedActionException extends GrpcInvalidArgumentException {
  constructor(message: string, reason: string, operation: string, messageId: string) {
    super(message, reason, operation, messageId);
    this.name = 'GrpcUnsupportedActionException';
  }
}
