/** Mirrors google.rpc.Code numeric values used by the gRPC server. */
export enum GrpcCode {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  NOT_FOUND = 5,
  INTERNAL = 13,
  UNAVAILABLE = 14,
}

const CODE_BY_NUMBER: Record<number, GrpcCode> = {
  0: GrpcCode.OK,
  1: GrpcCode.CANCELLED,
  2: GrpcCode.UNKNOWN,
  3: GrpcCode.INVALID_ARGUMENT,
  5: GrpcCode.NOT_FOUND,
  13: GrpcCode.INTERNAL,
  14: GrpcCode.UNAVAILABLE,
};

export function grpcCodeFromNumber(code: number): GrpcCode {
  return CODE_BY_NUMBER[code] ?? GrpcCode.UNKNOWN;
}
