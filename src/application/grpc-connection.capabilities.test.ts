import { describe, expect, it } from 'vitest';
import { PlaywrightGrpcConnection } from './grpc-connection.js';
import { GrpcEndpointConfig } from '../commons/application/grpc/GrpcEndpointConfig.js';
import { deserializeJson } from '../commons/application/utils/JsonHelpers.js';
import type { PlaywrightCommandExecutor } from '../protocol/command-executor.js';
import { PlaywrightBrowserSession } from '../session/playwright-browser-session.js';

describe('PlaywrightGrpcConnection capabilities', () => {
  it('getDriverInfo serializes browser capabilities', () => {
    const executor = {} as PlaywrightCommandExecutor;
    const browserSession = new PlaywrightBrowserSession('session-id', executor);
    const connection = new PlaywrightGrpcConnection(
      browserSession,
      GrpcEndpointConfig.of('localhost', 9091),
      'token',
    );

    const serialized = deserializeJson<Record<string, unknown>>(
      connection.getDriverInfo(null).capabilitiesJson,
    );

    expect(serialized).toMatchObject({
      browserName: 'chromium',
      platformName: 'ANY',
    });
  });
});
