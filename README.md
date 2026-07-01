# @testrigor/playwright-plugin

Playwright integration for the testRigor cloud extension — natural-language locators, fluent commands, and self-healing.

## Install

```bash
npm install @testrigor/playwright-plugin playwright
npx playwright install chromium
```

## Quick start

```typescript
import { TestRigor } from '@testrigor/playwright-plugin';

const driver = await TestRigor.createBrowserPage(process.env.TESTRIGOR_API_TOKEN!);
driver.setTestContext('my_test');

await driver.get('https://example.com');
const button = await driver.findElement(TestRigor.byUserDescription('Sign in'));
await button.click();

await driver.quit();
```

Attach to an existing Playwright page:

```typescript
import { TestRigor } from '@testrigor/playwright-plugin';

const driver = TestRigor.extendPage(page, apiToken);
driver.setTestContext('my_test');
```

## Fluent commands

```typescript
import { TestRigor } from '@testrigor/playwright-plugin';

const { actions, validations, queries } = TestRigor;

await actions(driver).openUrl('https://example.com').click('Empty Page').execute();
await validations(driver).checkPageContains('expected text').execute();
const value = await queries(driver).grabValue('Some field');
```

`setTestContext` is required before locator self-healing (scopes healing data on the server).

## Configuration

Environment variables:

| Variable                        | Default                            |
| ------------------------------- | ---------------------------------- |
| `TESTRIGOR_API_TOKEN`           | none - must be provided            |
| `TESTRIGOR_GRPC_URI`            | `selenium-extension.testrigor.com` |
| `TESTRIGOR_GRPC_PORT`           | `443`                              |
| `TESTRIGOR_GRPC_USE_TLS`        | auto (TLS enabled for port 443)    |
| `TESTRIGOR_PLAYWRIGHT_BROWSER`  | `chromium`                         |
| `TESTRIGOR_PLAYWRIGHT_HEADLESS` | `false`                            |

Manual integration tests load settings from `tests/resources/application.properties` (copy from `application.properties.example`). Override the path with `CONFIG_FILE` or `config.file`.

The API token is **not** read automatically by the library — pass it to `createBrowserPage` / `extendPage`, or set `testrigor.apiToken` / `TESTRIGOR_API_TOKEN` for manual tests only.

## Development

```bash
npm install
npm run check          # lint + format + build + unit tests
npm run test:manual    # live gRPC integration tests (requires service + config)
npm run test:manual:one  # single manual test by name (-t flag)
```

## Layout

```
src/
  application/     Extension service, gRPC connection, driver
  protocol/        Remote driver commands → Playwright
  elements/        Element registry and wrappers
  locators/        Locators and self-healing finder
  session/         Browser launch and page wrapping
  commons/         gRPC client, command facades, shared types
  testrigor.ts     Public entry point
tests/manual/      Live gRPC integration tests
```
