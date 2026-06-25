import { describe, expect, it, vi } from 'vitest';
import { PlaywrightGrpcConnection } from './grpc-connection.js';
import { GrpcEndpointConfig } from '../commons/application/grpc/GrpcEndpointConfig.js';
import type { ClientMessage } from '../commons/grpc/testrigor-grpc.js';
import type { PlaywrightCommandExecutor } from '../protocol/command-executor.js';
import { PlaywrightBrowserSession } from '../session/playwright-browser-session.js';

describe('PlaywrightGrpcConnection driver commands', () => {
  it('writes a JSON payload for getCurrentUrl responses', async () => {
    const executor = {
      execute: vi.fn().mockResolvedValue({
        sessionId: 'session-1',
        status: 0,
        state: '',
        value: 'http://example.com',
      }),
    } as unknown as PlaywrightCommandExecutor;
    const browserSession = new PlaywrightBrowserSession('session-1', executor);
    const connection = new PlaywrightGrpcConnection(
      browserSession,
      GrpcEndpointConfig.of('localhost', 9091),
      'token',
    );

    const written: ClientMessage[] = [];
    await connection.executeCommand('cmd-1', 'session-1', 'getCurrentUrl', '{}', {
      write: (message) => written.push(message),
    });

    expect(written).toHaveLength(1);
    const payload = written[0]?.payload?.response?.valuePayload?.toString('utf8');
    expect(payload).toBe('"http://example.com"');
  });

  it('writes a driver error response when command execution fails', async () => {
    const executor = {
      execute: vi.fn().mockRejectedValue(new Error('unsupported')),
    } as unknown as PlaywrightCommandExecutor;
    const browserSession = new PlaywrightBrowserSession('session-1', executor);
    const connection = new PlaywrightGrpcConnection(
      browserSession,
      GrpcEndpointConfig.of('localhost', 9091),
      'token',
    );

    const written: ClientMessage[] = [];
    await connection.executeCommand('cmd-2', 'session-1', 'missingCommand', '{}', {
      write: (message) => written.push(message),
    });

    expect(written).toHaveLength(1);
    expect(written[0]?.payload?.response?.status).toBe(13);
    expect(written[0]?.payload?.response?.valuePayload?.toString('utf8')).toContain('unsupported');
  });
});
