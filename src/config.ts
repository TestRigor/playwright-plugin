import {
  DEFAULT_GRPC_HOST,
  DEFAULT_GRPC_PORT,
  type GrpcHoconConfig,
} from './commons/application/grpc/GrpcEndpointConfig.js';
import type { PlaywrightLaunchConfig } from './session/playwright-session.js';

/**
 * Plugin configuration replacing Typesafe Config / application.properties.
 * Keys mirror testRigor HOCON property names from application.properties.
 */
export interface PlaywrightPluginConfig extends GrpcHoconConfig {
  'playwright.browser'?: string;
  'playwright.headless'?: boolean;
}

/** Default gRPC endpoint and Playwright launch settings. */
export const DEFAULT_APPLICATION_PROPERTIES: PlaywrightPluginConfig = {
  'testrigor.grpc.uri': DEFAULT_GRPC_HOST,
  'testrigor.grpc.port': DEFAULT_GRPC_PORT,
  'playwright.browser': 'chromium',
  'playwright.headless': false,
};

const ENV_GRPC_URI = 'TESTRIGOR_GRPC_URI';
const ENV_GRPC_PORT = 'TESTRIGOR_GRPC_PORT';
const ENV_GRPC_USE_TLS = 'TESTRIGOR_GRPC_USE_TLS';
const ENV_PLAYWRIGHT_BROWSER = 'TESTRIGOR_PLAYWRIGHT_BROWSER';
const ENV_PLAYWRIGHT_HEADLESS = 'TESTRIGOR_PLAYWRIGHT_HEADLESS';

function loadConfigFromEnv(): Partial<PlaywrightPluginConfig> {
  const config: Partial<PlaywrightPluginConfig> = {};
  const uri = process.env[ENV_GRPC_URI];
  if (uri != null && uri.trim() !== '') {
    config['testrigor.grpc.uri'] = uri.trim();
  }
  const port = process.env[ENV_GRPC_PORT];
  if (port != null && port.trim() !== '') {
    const parsed = Number.parseInt(port, 10);
    if (!Number.isNaN(parsed)) {
      config['testrigor.grpc.port'] = parsed;
    }
  }
  const useTls = process.env[ENV_GRPC_USE_TLS];
  if (useTls != null && useTls.trim() !== '') {
    config['testrigor.grpc.use-tls'] = useTls.trim().toLowerCase() === 'true';
  }
  const browser = process.env[ENV_PLAYWRIGHT_BROWSER];
  if (browser != null && browser.trim() !== '') {
    config['playwright.browser'] = browser.trim();
  }
  const headless = process.env[ENV_PLAYWRIGHT_HEADLESS];
  if (headless != null && headless.trim() !== '') {
    config['playwright.headless'] = headless.trim().toLowerCase() === 'true';
  }
  return config;
}

export function loadDefaultConfig(
  overrides?: Partial<PlaywrightPluginConfig>,
): PlaywrightPluginConfig {
  return {
    ...DEFAULT_APPLICATION_PROPERTIES,
    ...loadConfigFromEnv(),
    ...overrides,
  };
}

export function toLaunchConfig(config: PlaywrightPluginConfig): PlaywrightLaunchConfig {
  return {
    browser: config['playwright.browser'] ?? 'chromium',
    headless: config['playwright.headless'] ?? false,
  };
}
