import type { DriverCommandResponse } from '../protocol/driver-command-response.js';
import type { PlaywrightCommandExecutor } from '../protocol/command-executor.js';
import { BROWSER_NAME, PLATFORM_NAME } from './playwright-driver-constants.js';

export class PlaywrightBrowserSession {
  readonly sessionId: string;
  readonly capabilities: Record<string, unknown>;
  readonly commandExecutor: PlaywrightCommandExecutor;

  constructor(sessionId: string, executor: PlaywrightCommandExecutor) {
    this.sessionId = sessionId;
    this.commandExecutor = executor;
    this.capabilities = {
      browserName: BROWSER_NAME,
      platformName: PLATFORM_NAME,
    };
  }

  executeCommand(
    commandName: string,
    parameters: Record<string, unknown> = {},
  ): Promise<DriverCommandResponse> {
    return this.commandExecutor.execute(commandName, parameters);
  }
}
