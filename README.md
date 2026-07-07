testrigor/playwright-plugin

Playwright integration for the testRigor cloud extension — natural-language locators, fluent commands, and self-healing.
## Install

Requires **Node.js >= 18**. `playwright` is a peer dependency, so install it alongside the plugin:

```bash
npm i @testrigor/playwright-plugin
npx playwright install chromium
```

Then import it in your project:

```typescript
import { TestRigor } from '@testrigor/playwright-plugin';
```

## Quick start

```typescript
import { TestRigor } from '@testrigor/playwright-plugin';

const driver = await TestRigor.createBrowserPage(process.env.TESTRIGOR_API_TOKEN!);
driver.setTestContext('my_test');

await driver.get('https://example.com');
const button = await driver.findElement(TestRigor.byUserDescription('Learn more'));
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

The only setting you need to provide is your testRigor personal API token.

| Variable                        | Default    | Description               |
| ------------------------------- | -----------| ------------------------- |
| `TESTRIGOR_API_TOKEN`           |            | Your testRigor API token. |
| `TESTRIGOR_PLAYWRIGHT_BROWSER`  | `chromium` |                           |
| `TESTRIGOR_PLAYWRIGHT_HEADLESS` | `false`    |                           |

The token is **not** read automatically by the library — pass it explicitly to `createBrowserPage` / `extendPage`:

```typescript
import { TestRigor } from '@testrigor/playwright-plugin';

const driver = await TestRigor.createBrowserPage(process.env.TESTRIGOR_API_TOKEN!);
```
