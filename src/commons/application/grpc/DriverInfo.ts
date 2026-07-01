export class DriverInfo {
  constructor(
    readonly sessionId: string,
    readonly capabilitiesJson: string,
    readonly testId?: string | null,
  ) {}
}
