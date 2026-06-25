import fs from 'node:fs';
import path from 'node:path';
import { GrpcEndpointConfig } from '../../src/commons/application/grpc/GrpcEndpointConfig.js';
import { loadDefaultConfig, type PlaywrightPluginConfig } from '../../src/config.js';

const APPLICATION_PROPERTIES = 'application.properties';
const APPLICATION_PROPERTIES_EXAMPLE = 'application.properties.example';
const DEFAULT_MANUAL_TESTS_RESOURCES = path.resolve(process.cwd(), 'tests/resources');

export interface ManualTestConfig {
  config: PlaywrightPluginConfig;
  grpcEndpoint: GrpcEndpointConfig;
  apiToken: string;
}

function normalizeConfigValue(value: string | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parsePropertiesFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const properties: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator < 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = normalizeConfigValue(trimmed.slice(separator + 1));
    if (value != null) {
      properties[key] = value;
    }
  }
  return properties;
}

function loadPropertiesLayers(): Record<string, string> {
  const resourcesDir = DEFAULT_MANUAL_TESTS_RESOURCES;
  const examplePath = path.join(resourcesDir, APPLICATION_PROPERTIES_EXAMPLE);
  const applicationPath = path.join(resourcesDir, APPLICATION_PROPERTIES);

  let merged = parsePropertiesFile(examplePath);
  merged = { ...merged, ...parsePropertiesFile(applicationPath) };

  const configFile = process.env.CONFIG_FILE ?? process.env['config.file'];
  if (configFile != null && configFile.trim() !== '') {
    merged = { ...merged, ...parsePropertiesFile(path.resolve(configFile.trim())) };
  }

  return merged;
}

function resolveOptional(
  properties: Record<string, string>,
  key: string,
  envKey: string,
): string | undefined {
  const fromProperties = normalizeConfigValue(properties[key]);
  if (fromProperties != null && fromProperties !== '') {
    return fromProperties;
  }
  return normalizeConfigValue(process.env[envKey]);
}

function assignString(
  config: PlaywrightPluginConfig,
  properties: Record<string, string>,
  key: 'testrigor.grpc.uri' | 'playwright.browser',
  envKey: string,
): void {
  const value = resolveOptional(properties, key, envKey);
  if (value != null) {
    config[key] = value;
  }
}

function assignNumber(
  config: PlaywrightPluginConfig,
  properties: Record<string, string>,
  key: 'testrigor.grpc.port',
  envKey: string,
): void {
  const value = resolveOptional(properties, key, envKey);
  if (value == null) {
    return;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isNaN(parsed)) {
    config[key] = parsed;
  }
}

function assignBoolean(
  config: PlaywrightPluginConfig,
  properties: Record<string, string>,
  key: 'testrigor.grpc.use-tls' | 'playwright.headless',
  envKey: string,
): void {
  const value = resolveOptional(properties, key, envKey);
  if (value != null) {
    config[key] = value.toLowerCase() === 'true';
  }
}

function toPluginConfig(properties: Record<string, string>): PlaywrightPluginConfig {
  const config = loadDefaultConfig();

  assignString(config, properties, 'testrigor.grpc.uri', 'TESTRIGOR_GRPC_URI');
  assignNumber(config, properties, 'testrigor.grpc.port', 'TESTRIGOR_GRPC_PORT');
  assignBoolean(config, properties, 'testrigor.grpc.use-tls', 'TESTRIGOR_GRPC_USE_TLS');
  assignString(config, properties, 'playwright.browser', 'TESTRIGOR_PLAYWRIGHT_BROWSER');
  assignBoolean(config, properties, 'playwright.headless', 'TESTRIGOR_PLAYWRIGHT_HEADLESS');

  return config;
}

function getRequiredValue(properties: Record<string, string>, key: string, envKey: string): string {
  const value = resolveOptional(properties, key, envKey);
  if (value == null || value === '') {
    throw new Error(
      `Missing required configuration: ${key} (${APPLICATION_PROPERTIES} / ` +
        `${APPLICATION_PROPERTIES_EXAMPLE} / env ${envKey})`,
    );
  }
  return value;
}

export function initManualTestConfig(): ManualTestConfig {
  const properties = loadPropertiesLayers();
  const config = toPluginConfig(properties);
  const grpcEndpoint = GrpcEndpointConfig.fromConfig(config);
  const apiToken = getRequiredValue(properties, 'testrigor.apiToken', 'TESTRIGOR_API_TOKEN');
  return { config, grpcEndpoint, apiToken };
}
