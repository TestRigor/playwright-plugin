/** Protobuf package name on the wire (do not rename — server contract). */
export const TESTRIGOR_GRPC_PROTO_PACKAGE = 'com.testrigor.seleniumextension.grpc.lib';

/** Embedded gRPC schema — wire-compatible with the testRigor extension service. */
export const TESTRIGOR_GRPC_SCHEMA = `
syntax = "proto3";

package com.testrigor.seleniumextension.grpc.lib;

message ProtobufAny {
  string type_url = 1;
  bytes value = 2;
}

message RpcStatus {
  int32 code = 1;
  string message = 2;
  repeated ProtobufAny details = 3;
}

service TestRigorService {
  rpc findElement (stream ClientMessage) returns (stream ServerMessage) {}
  rpc executePrompt (stream ClientMessage) returns (stream ServerMessage) {}
  rpc executeAction (stream ClientMessage) returns (stream ServerMessage) {}
}

message DriverCommand {
  string sessionId = 1;
  DriverCommandPayload payload = 2;
}

message DriverCommandPayload {
  string name = 1;
  string parametersJson = 2;
}

enum ValueEncoding {
  VALUE_ENCODING_UNSPECIFIED = 0;
  JSON_UTF8 = 1;
  GZIP_JSON_UTF8 = 2;
}

message DriverCommandResponse {
  ValueEncoding value_encoding = 1;
  bytes value_payload = 2;
  string sessionId = 3;
  int32 status = 4;
  string state = 5;
}

message Driver {
  string sessionId = 1;
  optional string capabilitiesJson = 2;
  optional string test_id = 3;
}

message ClientMessagePayload {
  optional DriverCommandResponse response = 1;
  optional Driver driver = 2;
  optional string message = 3;
  optional ActionRequest action = 4;
}

message ClientMessage {
  string id = 1;
  ClientMessagePayload payload = 3;
}

message ActionRequest {
  string name = 1;
  string parametersJson = 2;
}

message Result {
  optional string value = 1 [deprecated = true];
  oneof typedValue {
    string elementXpath = 2;
    string stringValue = 3;
    bool boolValue = 4;
    string jsonValue = 5;
  }
}

message ServerMessage {
  string id = 1;
  oneof message {
    DriverCommand command = 2;
    Result result = 3;
    RpcStatus status = 4;
  }
}
`;
