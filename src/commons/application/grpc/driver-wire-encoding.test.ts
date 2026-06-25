import protobuf from 'protobufjs';
import { describe, expect, it } from 'vitest';
import {
  TESTRIGOR_GRPC_PROTO_PACKAGE,
  TESTRIGOR_GRPC_SCHEMA,
} from '../../grpc/testrigor-grpc-schema.js';

describe('Driver gRPC wire encoding', () => {
  it('serializes testId on the wire using proto-loader field names', () => {
    const root = protobuf.parse(TESTRIGOR_GRPC_SCHEMA).root;
    root.resolveAll();
    const ClientMessage = root.lookupType(`${TESTRIGOR_GRPC_PROTO_PACKAGE}.ClientMessage`);

    const encoded = ClientMessage.encode({
      id: 'msg-1',
      payload: {
        driver: {
          sessionId: 'session-1',
          capabilitiesJson: '{}',
          testId: 'test_self_healing_locator',
        },
      },
    }).finish();
    const decoded = ClientMessage.toObject(ClientMessage.decode(encoded), {
      defaults: true,
      enums: String,
    });

    expect(decoded.payload.driver.testId).toBe('test_self_healing_locator');
  });
});
