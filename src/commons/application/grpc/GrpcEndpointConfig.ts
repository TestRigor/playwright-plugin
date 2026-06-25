export const DEFAULT_GRPC_HOST = 'selenium-extension.testrigor.com';
export const DEFAULT_GRPC_PORT = 443;

export interface TestRigorGrpcConfig {
  uri?: string;
  port?: number;
  useTls?: boolean;
}

/** HOCON-style config keys accepted by {@link GrpcEndpointConfig.fromConfig}. */
export interface GrpcHoconConfig {
  'testrigor.grpc.uri'?: string;
  'testrigor.grpc.port'?: number;
  'testrigor.grpc.use-tls'?: boolean;
}

/**
 * Immutable gRPC endpoint for the testRigor extension service.
 */
export class GrpcEndpointConfig {
  readonly host: string;
  readonly port: number;
  /** When null, TLS matches legacy behavior: enabled for port 443, plaintext otherwise. */
  readonly useTls: boolean | null;

  private constructor(hostValue: string, portValue: number, useTlsValue: boolean | null) {
    if (!hostValue || hostValue.trim() === '') {
      throw new Error('gRPC host must not be blank');
    }
    if (portValue < 1 || portValue > 65535) {
      throw new Error(`gRPC port must be between 1 and 65535: ${portValue}`);
    }
    this.host = hostValue.trim();
    this.port = portValue;
    this.useTls = useTlsValue;
  }

  static of(
    hostValue: string,
    portValue: number,
    useTlsValue: boolean | null = null,
  ): GrpcEndpointConfig {
    return new GrpcEndpointConfig(hostValue, portValue, useTlsValue);
  }

  static fromConfig(config: GrpcHoconConfig | TestRigorGrpcConfig): GrpcEndpointConfig {
    if ('host' in config || 'uri' in config) {
      const simple = config as TestRigorGrpcConfig;
      const hostValue = simple.uri?.trim() || DEFAULT_GRPC_HOST;
      const portValue = simple.port ?? DEFAULT_GRPC_PORT;
      return new GrpcEndpointConfig(hostValue, portValue, simple.useTls ?? null);
    }

    const hocon = config as GrpcHoconConfig;
    const uri = hocon['testrigor.grpc.uri'] ?? '';
    const hostValue = uri.trim() === '' ? DEFAULT_GRPC_HOST : uri.trim();
    const portValue = hocon['testrigor.grpc.port'] ?? DEFAULT_GRPC_PORT;
    const useTlsValue = hocon['testrigor.grpc.use-tls'] ?? null;
    return new GrpcEndpointConfig(hostValue, portValue, useTlsValue);
  }

  useTransportSecurity(): boolean {
    return GrpcEndpointConfig.resolveUseTls(this.port, this.useTls);
  }

  static resolveUseTls(portValue: number, useTlsOverride: boolean | null | undefined): boolean {
    if (useTlsOverride != null) {
      return useTlsOverride;
    }
    return portValue === 443;
  }
}
