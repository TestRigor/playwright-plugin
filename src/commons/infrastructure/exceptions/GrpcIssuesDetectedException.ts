import { GrpcInternalException } from './GrpcInternalException.js';

export class GrpcIssuesDetectedException extends GrpcInternalException {
  constructor(message: string, reason: string, operation: string, messageId: string) {
    super(message, reason, operation, messageId);
    this.name = 'GrpcIssuesDetectedException';
  }
}
