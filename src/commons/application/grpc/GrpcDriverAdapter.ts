import type { ClientMessage } from '../../grpc/testrigor-grpc.js';
import type { DriverInfo } from './DriverInfo.js';

export interface GrpcDriverAdapter {
  /**
   * @param testIdOverride if non-null and non-blank, used as testId for the gRPC Driver payload;
   *                       otherwise implementations may fall back to TestRigorContext
   */
  getDriverInfo(testIdOverride?: string | null): DriverInfo | Promise<DriverInfo>;

  executeCommand(
    messageId: string,
    sessionId: string,
    commandName: string,
    parametersJson: string,
    responseWriter: ClientMessageWriter,
  ): void | Promise<void>;

  resolveElementFromXpath(xpath: string): unknown | Promise<unknown>;
}

export interface ClientMessageWriter {
  write(message: ClientMessage): void;
}
