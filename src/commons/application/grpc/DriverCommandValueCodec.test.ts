import protobuf from 'protobufjs';
import { describe, expect, it } from 'vitest';
import { DriverCommandValueCodec } from './DriverCommandValueCodec.js';
import {
  TESTRIGOR_GRPC_PROTO_PACKAGE,
  TESTRIGOR_GRPC_SCHEMA,
} from '../../grpc/testrigor-grpc-schema.js';
import type { DriverCommandResponse } from '../../grpc/testrigor-grpc.js';

describe('DriverCommandValueCodec wire encoding', () => {
  it('serializes valuePayload on the wire using proto-loader field names', () => {
    const root = protobuf.parse(TESTRIGOR_GRPC_SCHEMA).root;
    root.resolveAll();
    const ClientMessage = root.lookupType(`${TESTRIGOR_GRPC_PROTO_PACKAGE}.ClientMessage`);

    const response: DriverCommandResponse = {
      sessionId: 'session-1',
      status: 0,
      state: '',
    };
    DriverCommandValueCodec.setEncodedValue(response, '"http://example.com"');

    const encoded = ClientMessage.encode({
      id: 'cmd-1',
      payload: { response },
    }).finish();
    const decoded = ClientMessage.toObject(ClientMessage.decode(encoded), {
      defaults: true,
      enums: String,
    });

    expect(Buffer.from(decoded.payload.response.valuePayload).toString('utf8')).toBe(
      '"http://example.com"',
    );
    expect(decoded.payload.response.valuePayload.length).toBeGreaterThan(0);
  });
});
