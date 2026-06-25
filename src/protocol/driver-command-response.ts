export interface DriverCommandResponse {
  sessionId: string;
  status: number;
  state: string;
  value: unknown;
}

export function createDriverCommandResponse(params: {
  sessionId: string;
  status: number;
  state: string;
  value: unknown;
}): DriverCommandResponse {
  return params;
}
