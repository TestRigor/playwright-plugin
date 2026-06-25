import { GrpcInternalException } from './GrpcInternalException.js';

export class GrpcActionExecutionException extends GrpcInternalException {
  constructor(message: string, reason: string, operation: string, messageId: string) {
    super(message, reason, operation, messageId);
    this.name = 'GrpcActionExecutionException';
  }
}
