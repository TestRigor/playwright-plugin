import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import protobuf from 'protobufjs';
import { TESTRIGOR_GRPC_SCHEMA } from './testrigor-grpc-schema.js';

const PROTO_LOADER_OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
} as const;

export type ValueEncoding = 'VALUE_ENCODING_UNSPECIFIED' | 'JSON_UTF8' | 'GZIP_JSON_UTF8';

export interface DriverCommandPayload {
  name?: string;
  parametersJson?: string;
}

export interface DriverCommand {
  sessionId?: string;
  payload?: DriverCommandPayload;
}

export interface DriverCommandResponse {
  valueEncoding?: ValueEncoding;
  valuePayload?: Buffer;
  sessionId?: string;
  status?: number;
  state?: string;
}

export interface Driver {
  sessionId?: string;
  capabilitiesJson?: string;
  testId?: string;
}

export interface ActionRequest {
  name?: string;
  parametersJson?: string;
}

export interface ClientMessagePayload {
  response?: DriverCommandResponse;
  driver?: Driver;
  message?: string;
  action?: ActionRequest;
}

export interface ClientMessage {
  id?: string;
  payload?: ClientMessagePayload;
}

export interface Result {
  value?: string;
  elementXpath?: string;
  stringValue?: string;
  boolValue?: boolean;
  jsonValue?: string;
}

export interface RpcStatus {
  code?: number;
  message?: string;
  details?: Array<{ type_url?: string; value?: Buffer }>;
}

export interface ServerMessage {
  id?: string;
  command?: DriverCommand;
  result?: Result;
  status?: RpcStatus;
}

export type TestRigorServiceClient = grpc.Client &
  Pick<
    grpc.Client,
    | 'close'
    | 'getChannel'
    | 'waitForReady'
    | 'makeUnaryRequest'
    | 'makeClientStreamRequest'
    | 'makeServerStreamRequest'
    | 'makeBidiStreamRequest'
  > & {
    findElement: (
      metadata?: grpc.Metadata,
      options?: Partial<grpc.CallOptions>,
    ) => grpc.ClientDuplexStream<ClientMessage, ServerMessage>;
    executePrompt: (
      metadata?: grpc.Metadata,
      options?: Partial<grpc.CallOptions>,
    ) => grpc.ClientDuplexStream<ClientMessage, ServerMessage>;
    executeAction: (
      metadata?: grpc.Metadata,
      options?: Partial<grpc.CallOptions>,
    ) => grpc.ClientDuplexStream<ClientMessage, ServerMessage>;
  };

interface TestRigorProtoPackage {
  com: {
    testrigor: {
      seleniumextension: {
        grpc: {
          lib: {
            TestRigorService: grpc.ServiceClientConstructor;
          };
        };
      };
    };
  };
}

function loadPackageDefinition(): protoLoader.PackageDefinition {
  const root = protobuf.parse(TESTRIGOR_GRPC_SCHEMA).root;
  if (root == null) {
    throw new Error('Failed to parse embedded TestRigor gRPC schema');
  }
  root.resolveAll();
  return protoLoader.fromJSON(root.toJSON(), PROTO_LOADER_OPTIONS);
}

const packageDefinition = loadPackageDefinition();
const protoDescriptor = grpc.loadPackageDefinition(
  packageDefinition,
) as unknown as TestRigorProtoPackage;

const TestRigorService = protoDescriptor.com.testrigor.seleniumextension.grpc.lib.TestRigorService;

export function createTestRigorServiceClient(
  address: string,
  credentials: grpc.ChannelCredentials,
  options?: grpc.ClientOptions,
): TestRigorServiceClient {
  return new TestRigorService(address, credentials, options) as unknown as TestRigorServiceClient;
}
