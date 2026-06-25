import { gzipSync } from 'node:zlib';
import type { DriverCommandResponse } from '../../grpc/testrigor-grpc.js';

const GZIP_MIN_BYTES = 512;

/**
 * Encodes driver command return values as valuePayload + valueEncoding for gRPC.
 */
export class DriverCommandValueCodec {
  private constructor() {}

  static setEncodedValue(
    builder: DriverCommandResponse,
    jsonUtf8OrNull: string | null | undefined,
  ): void {
    const s = jsonUtf8OrNull ?? '';
    const utf8 = Buffer.from(s, 'utf8');
    if (utf8.length === 0) {
      builder.valueEncoding = 'JSON_UTF8';
      builder.valuePayload = Buffer.alloc(0);
      return;
    }
    if (utf8.length >= GZIP_MIN_BYTES) {
      builder.valueEncoding = 'GZIP_JSON_UTF8';
      builder.valuePayload = gzipSync(utf8);
    } else {
      builder.valueEncoding = 'JSON_UTF8';
      builder.valuePayload = utf8;
    }
  }
}
