import { TestRigorExtensionException } from './TestRigorExtensionException.js';

export class GrpcClientException extends TestRigorExtensionException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GrpcClientException';
  }
}
