import type { Browser, BrowserContext, Dialog, Frame, Page } from 'playwright';
import { ElementRegistry } from '../elements/element-registry.js';
import { ResolvedElement } from '../elements/resolved-element.js';
import { ElementNotFoundException } from '../errors/element-not-found-exception.js';
import { FrameNotFoundException } from '../errors/frame-not-found-exception.js';
import { PlaywrightDriverException } from '../errors/playwright-driver-exception.js';
import { WindowNotFoundException } from '../errors/window-not-found-exception.js';
import { resolveFrame, resolveLocator } from '../locators/playwright-locator-resolver.js';
import { ResolvedShadowRoot } from '../shadow/resolved-shadow-root.js';
import { ShadowRootRegistry } from '../shadow/shadow-root-registry.js';
import { BROWSER_NAME, PLATFORM_NAME } from '../session/playwright-driver-constants.js';
import { DriverCommandNames } from './driver-command-names.js';
import { readSendKeysText } from './send-keys-text.js';
import {
  createDriverCommandResponse,
  type DriverCommandResponse,
} from './driver-command-response.js';
import {
  resolveFrameByIndex,
  resolveFrameByName,
  resolveFrameFromElement,
} from './frame-resolver.js';
import { PlaywrightScriptResultConverter } from './script-result-converter.js';
import { runAsyncScriptInFrame, runSyncScriptInFrame } from './remote-script-adapter.js';

import {
  documentActiveElement,
  readElementCssProperty,
  readElementProperty,
  readElementTagName,
  readPageSource,
  submitElement,
} from './page-eval-functions.js';

const pageIdentity = new WeakMap<Page, number>();
let pageIdentityCounter = 0;

type PlaywrightLifecycle = { close(): Promise<void> };

function pageHashCode(page: Page): number {
  let identity = pageIdentity.get(page);
  if (identity == null) {
    identity = ++pageIdentityCounter;
    pageIdentity.set(page, identity);
  }
  return identity;
}

export class PlaywrightCommandExecutor {
  private readonly elementRegistry = new ElementRegistry();
  private readonly shadowRootRegistry = new ShadowRootRegistry();
  private readonly scriptResultConverter: PlaywrightScriptResultConverter;
  private readonly sessionId: string;
  private readonly playwright: PlaywrightLifecycle | null;
  private readonly browser: Browser | null;
  private readonly context: BrowserContext;
  readonly page: Page;
  private readonly onQuit: ((runnable: () => void | Promise<void>) => void) | null;

  private activePage: Page;
  private pendingDialog: Dialog | null = null;
  private activeFrame: Frame | null = null;

  constructor(
    sessionId: string,
    playwright: PlaywrightLifecycle | null,
    browser: Browser | null,
    context: BrowserContext,
    page: Page,
    onQuit: ((runnable: () => void | Promise<void>) => void) | null,
  ) {
    this.sessionId = sessionId;
    this.playwright = playwright;
    this.browser = browser;
    this.context = context;
    this.page = page;
    this.activePage = page;
    this.activeFrame = null;
    this.onQuit = onQuit;
    this.scriptResultConverter = new PlaywrightScriptResultConverter(this.elementRegistry);
    this.registerDialogHandler();
  }

  getPage(): Page {
    return this.page;
  }

  async execute(
    commandName: string,
    parameters: Record<string, unknown> = {},
  ): Promise<DriverCommandResponse> {
    try {
      return await this.executeInternal(commandName, parameters);
    } catch (error) {
      if (error instanceof PlaywrightDriverException || isPlaywrightException(error)) {
        throw error;
      }
      if (error instanceof Error) {
        throw new PlaywrightDriverException(error.message, error);
      }
      throw new PlaywrightDriverException(String(error));
    }
  }

  private async executeInternal(
    name: string,
    parameters: Record<string, unknown>,
  ): Promise<DriverCommandResponse> {
    switch (normalizeCommandName(name)) {
      case DriverCommandNames.NEW_SESSION:
        return this.success(this.newSession(parameters));
      case DriverCommandNames.QUIT:
        this.elementRegistry.clear();
        this.shadowRootRegistry.clear();
        if (this.onQuit != null) {
          this.onQuit(() => this.closeResources());
        } else {
          await this.closeResources();
        }
        return this.success(null);
      case DriverCommandNames.CLOSE:
        await this.closeCurrentPage();
        return this.success(null);
      case DriverCommandNames.GET:
        await this.navigate(String(parameters.url));
        return this.success(null);
      case DriverCommandNames.GET_CURRENT_URL:
        return this.success(this.readCurrentUrl());
      case DriverCommandNames.GET_TITLE:
        return this.success(await this.activePage.title());
      case DriverCommandNames.GET_PAGE_SOURCE:
        return this.success(await this.readPageSource());
      case DriverCommandNames.REFRESH:
      case DriverCommandNames.RELOAD:
        await this.reloadPage();
        return this.success(null);
      case DriverCommandNames.GO_BACK:
      case DriverCommandNames.BACK:
        await this.goBack();
        return this.success(null);
      case DriverCommandNames.GO_FORWARD:
      case DriverCommandNames.FORWARD:
        await this.goForward();
        return this.success(null);
      case DriverCommandNames.FIND_ELEMENT:
        return this.success(await this.findElement(parameters, false));
      case DriverCommandNames.FIND_ELEMENTS:
        return this.success(await this.findElements(parameters, false));
      case DriverCommandNames.FIND_CHILD_ELEMENT:
        return this.success(await this.findElement(parameters, true));
      case DriverCommandNames.FIND_CHILD_ELEMENTS:
        return this.success(await this.findElements(parameters, true));
      case DriverCommandNames.GET_ELEMENT_SHADOW_ROOT:
        return this.success(await this.getElementShadowRoot(parameters));
      case DriverCommandNames.FIND_ELEMENT_FROM_SHADOW_ROOT:
        return this.success(await this.findElementFromShadowRoot(parameters));
      case DriverCommandNames.FIND_ELEMENTS_FROM_SHADOW_ROOT:
        return this.success(await this.findElementsFromShadowRoot(parameters));
      case DriverCommandNames.CLICK:
        await this.elementRegistry.resolve(parameters).click();
        return this.success(null);
      case DriverCommandNames.CLEAR:
        await this.elementRegistry.resolve(parameters).fill('');
        return this.success(null);
      case DriverCommandNames.SUBMIT: {
        const handle = await this.elementRegistry.resolve(parameters).toElementHandle();
        await submitElement(handle);
        return this.success(null);
      }
      case DriverCommandNames.SEND_KEYS_TO_ELEMENT:
        await this.sendKeys(parameters);
        return this.success(null);
      case DriverCommandNames.GET_ELEMENT_TEXT:
        return this.success(await this.elementRegistry.resolve(parameters).innerText());
      case DriverCommandNames.GET_ELEMENT_PROPERTY:
      case DriverCommandNames.GET_ELEMENT_DOM_PROPERTY: {
        const handle = await this.elementRegistry.resolve(parameters).toElementHandle();
        return this.success(await readElementProperty(handle, readNameParameter(parameters)));
      }
      case DriverCommandNames.GET_ELEMENT_ATTRIBUTE:
      case DriverCommandNames.GET_ELEMENT_DOM_ATTRIBUTE:
        return this.success(
          await this.elementRegistry
            .resolve(parameters)
            .getAttribute(readNameParameter(parameters)),
        );
      case DriverCommandNames.GET_ELEMENT_VALUE_OF_CSS_PROPERTY: {
        const handle = await this.elementRegistry.resolve(parameters).toElementHandle();
        return this.success(await readElementCssProperty(handle, readCssPropertyName(parameters)));
      }
      case DriverCommandNames.IS_ELEMENT_DISPLAYED:
        return this.success(await this.elementRegistry.resolve(parameters).isVisible());
      case DriverCommandNames.IS_ELEMENT_ENABLED:
        return this.success(await this.elementRegistry.resolve(parameters).isEnabled());
      case DriverCommandNames.IS_ELEMENT_SELECTED:
        return this.success(await this.elementRegistry.resolve(parameters).isSelected());
      case DriverCommandNames.GET_ELEMENT_TAG_NAME: {
        const handle = await this.elementRegistry.resolve(parameters).toElementHandle();
        return this.success(await readElementTagName(handle));
      }
      case DriverCommandNames.GET_ELEMENT_RECT:
      case DriverCommandNames.GET_ELEMENT_LOCATION_ONCE_SCROLLED_INTO_VIEW:
        return this.success(await this.toRectMap(this.elementRegistry.resolve(parameters)));
      case DriverCommandNames.GET_ELEMENT_LOCATION:
        return this.success(await this.toLocationMap(this.elementRegistry.resolve(parameters)));
      case DriverCommandNames.GET_ELEMENT_SIZE:
        return this.success(await this.toSizeMap(this.elementRegistry.resolve(parameters)));
      case DriverCommandNames.ELEMENT_SCREENSHOT:
        return this.success(await this.elementScreenshot(this.elementRegistry.resolve(parameters)));
      case DriverCommandNames.GET_ACTIVE_ELEMENT:
        return this.success(await this.registerActiveElement());
      case DriverCommandNames.EXECUTE_SCRIPT:
        return this.success(await this.executeScript(parameters, false));
      case DriverCommandNames.EXECUTE_ASYNC_SCRIPT:
        return this.success(await this.executeScript(parameters, true));
      case DriverCommandNames.SCREENSHOT:
        return this.success(await this.screenshot());
      case DriverCommandNames.SWITCH_TO_FRAME:
        await this.switchToFrame(parameters);
        return this.success(null);
      case DriverCommandNames.SWITCH_TO_PARENT_FRAME:
        this.activeFrame = this.activeFrame == null ? null : this.activeFrame.parentFrame();
        return this.success(null);
      case DriverCommandNames.GET_CURRENT_WINDOW_HANDLE:
        return this.success(
          `${pageHashCode(this.activePage)}:${this.context.pages().indexOf(this.activePage)}`,
        );
      case DriverCommandNames.GET_WINDOW_HANDLES:
        return this.success(this.collectWindowHandles());
      case DriverCommandNames.SWITCH_TO_WINDOW:
        await this.switchToWindow(String(parameters.handle));
        return this.success(null);
      case DriverCommandNames.MAXIMIZE_WINDOW:
      case DriverCommandNames.FULLSCREEN_WINDOW:
        await this.activePage.setViewportSize({ width: 1920, height: 1080 });
        return this.success(null);
      case DriverCommandNames.MINIMIZE_WINDOW:
        return this.success(null);
      case DriverCommandNames.GET_WINDOW_RECT:
      case DriverCommandNames.GET_CURRENT_WINDOW_SIZE: {
        const viewport = this.activePage.viewportSize();
        return this.success({
          width: viewport?.width ?? 0,
          height: viewport?.height ?? 0,
        });
      }
      case DriverCommandNames.GET_CURRENT_WINDOW_POSITION:
        return this.success({ x: 0, y: 0 });
      case DriverCommandNames.SET_WINDOW_RECT:
      case DriverCommandNames.SET_CURRENT_WINDOW_SIZE:
        await this.activePage.setViewportSize({
          width: Number(parameters.width),
          height: Number(parameters.height),
        });
        return this.success(null);
      case DriverCommandNames.SET_CURRENT_WINDOW_POSITION:
        return this.success(null);
      case DriverCommandNames.SET_TIMEOUT:
      case DriverCommandNames.SET_SCRIPT_TIMEOUT:
      case DriverCommandNames.IMPLICITLY_WAIT:
        return this.success(null);
      case DriverCommandNames.GET_TIMEOUTS:
        return this.success({
          implicit: 0,
          pageLoad: 0,
          script: 0,
        });
      case DriverCommandNames.DELETE_ALL_COOKIES:
        await this.context.clearCookies();
        return this.success(null);
      case DriverCommandNames.GET_ALL_COOKIES:
        return this.success(this.toWireProtocolCookies(await this.context.cookies()));
      case DriverCommandNames.GET_COOKIE:
        return this.success(await this.findCookie(String(parameters.name)));
      case DriverCommandNames.DELETE_COOKIE:
        await this.deleteCookie(String(parameters.name));
        return this.success(null);
      case DriverCommandNames.ADD_COOKIE:
        await this.addCookie(parameters);
        return this.success(null);
      case DriverCommandNames.GET_ALERT_TEXT:
        return this.success(this.pendingDialog == null ? '' : this.pendingDialog.message());
      case DriverCommandNames.SET_ALERT_VALUE:
        if (this.pendingDialog != null) {
          await this.pendingDialog.accept(parameters.text == null ? '' : String(parameters.text));
        }
        return this.success(null);
      case DriverCommandNames.ACCEPT_ALERT:
        if (this.pendingDialog != null) {
          await this.pendingDialog.accept();
          this.pendingDialog = null;
        }
        return this.success(null);
      case DriverCommandNames.DISMISS_ALERT:
        if (this.pendingDialog != null) {
          await this.pendingDialog.dismiss();
          this.pendingDialog = null;
        }
        return this.success(null);
      case DriverCommandNames.GET_AVAILABLE_LOG_TYPES:
        return this.success(['browser', 'performance', 'client', 'driver']);
      case DriverCommandNames.GET_LOG:
        return this.success([]);
      case DriverCommandNames.GET_SESSION_LOGS:
        return this.success([]);
      default:
        console.warn(`Unsupported Playwright command: ${name}`);
        throw new Error(`Unsupported command: ${name}`);
    }
  }

  private success(value: unknown): DriverCommandResponse {
    return createDriverCommandResponse({
      sessionId: this.sessionId,
      status: 0,
      state: '',
      value,
    });
  }

  private newSession(parameters: Record<string, unknown>): Record<string, unknown> {
    const capabilities: Record<string, unknown> = {
      browserName: BROWSER_NAME,
      platformName: PLATFORM_NAME,
      acceptInsecureCerts: true,
    };
    const requested = parameters.capabilities;
    if (requested != null && typeof requested === 'object' && !Array.isArray(requested)) {
      Object.assign(capabilities, requested);
    }
    return capabilities;
  }

  async resolveElementByXpath(xpath: string): Promise<ResolvedElement> {
    const expression = xpath.startsWith('xpath=') ? xpath.slice('xpath='.length) : xpath;
    const locator = this.currentFrame().locator(`xpath=${expression}`);
    if ((await locator.count()) === 0) {
      throw new ElementNotFoundException(`Unable to locate element: ${xpath}`);
    }
    const resolved = ResolvedElement.fromLocator(locator.first());
    this.elementRegistry.register(resolved);
    return resolved;
  }

  private currentFrame(): Frame {
    if (this.activeFrame != null) {
      return this.activeFrame;
    }
    return this.activePage.mainFrame();
  }

  private readCurrentUrl(): string {
    const url = this.activePage.url();
    if (url != null && url !== '') {
      return url;
    }
    const frameUrl = this.currentFrame().url();
    return frameUrl == null || frameUrl === '' ? 'about:blank' : frameUrl;
  }

  private async navigate(url: string): Promise<void> {
    await this.activePage.goto(url, { waitUntil: 'load' });
    await this.activePage.waitForLoadState('domcontentloaded');
  }

  private async goBack(): Promise<void> {
    await this.activePage.goBack({ waitUntil: 'load' });
    await this.activePage.waitForLoadState('domcontentloaded');
  }

  private async goForward(): Promise<void> {
    await this.activePage.goForward({ waitUntil: 'load' });
    await this.activePage.waitForLoadState('domcontentloaded');
  }

  private async reloadPage(): Promise<void> {
    await this.activePage.reload({ waitUntil: 'load' });
    await this.activePage.waitForLoadState('domcontentloaded');
  }

  private async findElement(
    parameters: Record<string, unknown>,
    child: boolean,
  ): Promise<Record<string, string>> {
    if (child) {
      const parent = this.elementRegistry.resolve(parameters);
      const using = String(parameters.using);
      const value = String(parameters.value);
      return this.elementRegistry.register(await parent.findChild(using, value));
    }
    const locator = this.resolveSearchLocator(parameters);
    if ((await locator.count()) === 0) {
      throw new ElementNotFoundException('Unable to locate element');
    }
    return this.elementRegistry.register(locator.first());
  }

  private async findElements(
    parameters: Record<string, unknown>,
    child: boolean,
  ): Promise<Array<Record<string, string>>> {
    let locator;
    if (child) {
      const parent = this.elementRegistry.resolve(parameters);
      const using = String(parameters.using);
      const value = String(parameters.value);
      locator = resolveLocator(parent.toLocator(), using, value);
    } else {
      locator = this.resolveSearchLocator(parameters);
    }
    return this.registerLocators(locator);
  }

  private async registerLocators(
    locator: import('playwright').Locator,
  ): Promise<Array<Record<string, string>>> {
    const count = await locator.count();
    const elements: Array<Record<string, string>> = [];
    for (let index = 0; index < count; index++) {
      elements.push(this.elementRegistry.register(locator.nth(index)));
    }
    return elements;
  }

  private resolveSearchLocator(parameters: Record<string, unknown>) {
    const using = String(parameters.using);
    const value = String(parameters.value);
    return resolveFrame(this.currentFrame(), using, value);
  }

  private async getElementShadowRoot(
    parameters: Record<string, unknown>,
  ): Promise<Record<string, string>> {
    const element = this.elementRegistry.resolve(parameters);
    const shadowRoot = await ResolvedShadowRoot.fromHost(await element.toElementHandle());
    return this.shadowRootRegistry.register(shadowRoot);
  }

  private async findElementFromShadowRoot(
    parameters: Record<string, unknown>,
  ): Promise<Record<string, string>> {
    const shadowRoot = this.shadowRootRegistry.resolveFromParameters(parameters);
    const using = String(parameters.using);
    const value = String(parameters.value);
    return this.elementRegistry.register(await shadowRoot.findElement(using, value));
  }

  private async findElementsFromShadowRoot(
    parameters: Record<string, unknown>,
  ): Promise<Array<Record<string, string>>> {
    const shadowRoot = this.shadowRootRegistry.resolveFromParameters(parameters);
    const using = String(parameters.using);
    const value = String(parameters.value);
    const elements = await shadowRoot.findElements(using, value);
    const references: Array<Record<string, string>> = [];
    for (const element of elements) {
      references.push(this.elementRegistry.register(element));
    }
    return references;
  }

  private async sendKeys(parameters: Record<string, unknown>): Promise<void> {
    const element = this.elementRegistry.resolve(parameters);
    const text = readSendKeysText(parameters);
    if (text.length === 0) {
      return;
    }
    await element.type(text);
  }

  private async executeScript(
    parameters: Record<string, unknown>,
    asyncScript: boolean,
  ): Promise<unknown> {
    const script = String(parameters.script);
    const args = await this.extractScriptArgs(parameters.args);
    const handle = asyncScript
      ? await runAsyncScriptInFrame(this.currentFrame(), script, args)
      : await runSyncScriptInFrame(this.currentFrame(), script, args);
    return this.scriptResultConverter.convert(handle);
  }

  private async extractScriptArgs(rawArgs: unknown): Promise<unknown[]> {
    if (!Array.isArray(rawArgs)) {
      return [];
    }
    const resolved: unknown[] = [];
    for (const item of rawArgs) {
      resolved.push(await this.resolveScriptArg(item));
    }
    return resolved;
  }

  private async resolveScriptArg(arg: unknown): Promise<unknown> {
    if (arg == null || typeof arg !== 'object' || Array.isArray(arg)) {
      return arg;
    }
    const map = arg as Record<string, unknown>;
    if (ElementRegistry.extractElementId(map) == null) {
      return arg;
    }
    return this.elementRegistry.resolve(map).toElementHandle();
  }

  private async readPageSource(): Promise<string> {
    return readPageSource(this.currentFrame());
  }

  private async registerActiveElement(): Promise<Record<string, string>> {
    const handle = await documentActiveElement(this.currentFrame());
    const converted = await this.scriptResultConverter.convert(handle);
    if (converted != null && typeof converted === 'object' && !Array.isArray(converted)) {
      return converted as Record<string, string>;
    }
    return this.elementRegistry.register(this.currentFrame().locator('html').first());
  }

  private async elementScreenshot(element: ResolvedElement): Promise<string> {
    const bytes = await (await element.toElementHandle()).screenshot();
    return Buffer.from(bytes).toString('base64');
  }

  private async screenshot(): Promise<string> {
    const bytes = await this.activePage.screenshot({ type: 'png' });
    return Buffer.from(bytes).toString('base64');
  }

  private async switchToFrame(parameters: Record<string, unknown>): Promise<void> {
    const id = parameters.id;
    if (id == null) {
      this.activeFrame = null;
      return;
    }

    let frame: Frame | null;
    if (typeof id === 'number') {
      frame = await resolveFrameByIndex(this.currentFrame(), id);
    } else if (typeof id === 'object' && !Array.isArray(id)) {
      frame = await resolveFrameFromElement(
        this.activePage,
        this.currentFrame(),
        await this.elementRegistry.resolve(id as Record<string, unknown>).toElementHandle(),
      );
    } else {
      const frameToken = String(id);
      try {
        frame = await resolveFrameFromElement(
          this.activePage,
          this.currentFrame(),
          await this.elementRegistry.resolve({ id: frameToken }).toElementHandle(),
        );
      } catch (error) {
        if (
          !(error instanceof ElementNotFoundException) &&
          !(error instanceof Error && error.message === 'Missing element reference')
        ) {
          throw error;
        }
        frame = await resolveFrameByName(this.activePage, this.currentFrame(), frameToken);
      }
    }

    if (frame == null) {
      throw new FrameNotFoundException('Unable to locate frame');
    }
    this.activeFrame = frame;
  }

  private collectWindowHandles(): string[] {
    const handles: string[] = [];
    let index = 0;
    for (const contextPage of this.context.pages()) {
      handles.push(`${pageHashCode(contextPage)}:${index}`);
      index++;
    }
    return handles;
  }

  private async switchToWindow(handle: string): Promise<void> {
    const separator = handle.lastIndexOf(':');
    if (separator < 0) {
      throw new WindowNotFoundException(`Invalid window handle: ${handle}`);
    }
    const pageIndex = Number.parseInt(handle.substring(separator + 1), 10);
    const pages = this.context.pages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new WindowNotFoundException(`Unable to locate window: ${handle}`);
    }
    this.activePage = pages[pageIndex]!;
    await this.activePage.bringToFront();
    this.activeFrame = null;
  }

  private async closeCurrentPage(): Promise<void> {
    if (this.context.pages().length <= 1) {
      await this.activePage.close();
      return;
    }
    const closing = this.activePage;
    await closing.close();
    this.activePage = this.context.pages()[0]!;
    this.activeFrame = null;
  }

  private async toRectMap(element: ResolvedElement): Promise<Record<string, number>> {
    return boundingBoxMap(element, true, true);
  }

  private async toLocationMap(element: ResolvedElement): Promise<Record<string, number>> {
    return boundingBoxMap(element, false, true);
  }

  private async toSizeMap(element: ResolvedElement): Promise<Record<string, number>> {
    return boundingBoxMap(element, true, false);
  }

  private async findCookie(name: string): Promise<Record<string, unknown>> {
    for (const cookie of await this.context.cookies()) {
      if (name === cookie.name) {
        return this.toWireProtocolCookies([cookie])[0] ?? {};
      }
    }
    return {};
  }

  private async deleteCookie(name: string): Promise<void> {
    const remaining = (await this.context.cookies()).filter((cookie) => name !== cookie.name);
    await this.context.clearCookies();
    if (remaining.length > 0) {
      await this.context.addCookies(remaining);
    }
  }

  private async addCookie(parameters: Record<string, unknown>): Promise<void> {
    const cookie = parameters.cookie as Record<string, unknown>;
    const playwrightCookie: { name: string; value: string; domain?: string; path?: string } = {
      name: String(cookie.name),
      value: String(cookie.value),
    };
    if (cookie.domain != null) {
      playwrightCookie.domain = String(cookie.domain);
    }
    if (cookie.path != null) {
      playwrightCookie.path = String(cookie.path);
    }
    await this.context.addCookies([playwrightCookie]);
  }

  private registerDialogHandler(): void {
    this.activePage.on('dialog', (dialog) => {
      this.pendingDialog = dialog;
    });
    for (const contextPage of this.context.pages()) {
      contextPage.on('dialog', (dialog) => {
        this.pendingDialog = dialog;
      });
    }
  }

  private toWireProtocolCookies(
    cookies: Array<{ name: string; value: string; domain?: string; path?: string }>,
  ): Array<Record<string, unknown>> {
    return cookies.map((cookie) => {
      const wireCookie: Record<string, unknown> = {
        name: cookie.name,
        value: cookie.value,
      };
      if (cookie.domain != null) {
        wireCookie.domain = cookie.domain;
      }
      if (cookie.path != null) {
        wireCookie.path = cookie.path;
      }
      return wireCookie;
    });
  }

  private async closeResources(): Promise<void> {
    try {
      if (this.context != null) {
        await this.context.close();
      }
    } catch (error) {
      console.warn(
        `Error closing browser context: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      if (this.browser != null) {
        await this.browser.close();
      }
    } catch (error) {
      console.warn(
        `Error closing browser: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      if (this.playwright != null) {
        await this.playwright.close();
      }
    } catch (error) {
      console.warn(
        `Error closing Playwright: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function normalizeCommandName(name: string): string {
  const trimmed = name.trim();
  const aliases: Record<string, string> = {
    getUrl: DriverCommandNames.GET_CURRENT_URL,
  };
  return aliases[trimmed] ?? trimmed;
}

function readNameParameter(parameters: Record<string, unknown>): string {
  const name = parameters.name;
  return name == null ? '' : String(name);
}

function readCssPropertyName(parameters: Record<string, unknown>): string {
  const propertyName = parameters.propertyName;
  if (propertyName != null) {
    return String(propertyName);
  }
  return readNameParameter(parameters);
}

async function boundingBoxMap(
  element: ResolvedElement,
  includeSize: boolean,
  includeLocation: boolean,
): Promise<Record<string, number>> {
  const box = await element.boundingBox();
  if (box == null) {
    if (includeSize && includeLocation) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    if (includeLocation) {
      return { x: 0, y: 0 };
    }
    return { width: 0, height: 0 };
  }
  if (includeSize && includeLocation) {
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }
  if (includeLocation) {
    return { x: box.x, y: box.y };
  }
  return { width: box.width, height: box.height };
}

function isPlaywrightException(error: unknown): boolean {
  return error instanceof Error && error.name === 'TimeoutError';
}
