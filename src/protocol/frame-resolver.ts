import type { ElementHandle, Frame, Page } from 'playwright';
import { escapeCssAttribute, escapeCssId } from '../locators/playwright-locator-resolver.js';
import { elementsAreSame } from '../protocol/page-eval-functions.js';

const CONTENT_FRAME_ATTEMPTS = 20;
const CONTENT_FRAME_POLL_MS = 50;

export async function resolveFrameFromElement(
  page: Page,
  _searchRoot: Frame,
  iframeElement: ElementHandle,
): Promise<Frame | null> {
  await iframeElement.scrollIntoViewIfNeeded();

  let frame = await pollContentFrame(page, iframeElement);
  if (frame != null) {
    return frame;
  }

  frame = await resolveByNameOrId(page, iframeElement);
  if (frame != null) {
    return frame;
  }

  return findMatchingFrame(page, iframeElement);
}

export async function resolveFrameByIndex(searchRoot: Frame, index: number): Promise<Frame | null> {
  const iframes = searchRoot.locator('iframe, frame');
  const count = await iframes.count();
  if (index < 0 || index >= count) {
    return null;
  }
  const handle = await iframes.nth(index).elementHandle();
  if (handle == null) {
    return null;
  }
  return resolveFrameFromElement(searchRoot.page(), searchRoot, handle);
}

export async function resolveFrameByName(
  page: Page,
  searchRoot: Frame,
  nameOrId: string,
): Promise<Frame | null> {
  const namedFrame = page.frame(nameOrId);
  if (namedFrame != null) {
    return namedFrame;
  }

  const escaped = escapeCssAttribute(nameOrId);
  const escapedId = escapeCssId(nameOrId);
  const locator = searchRoot.locator(
    `frame[name='${escaped}'],iframe[name='${escaped}'],frame#${escapedId},iframe#${escapedId}`,
  );
  if ((await locator.count()) === 0) {
    return null;
  }
  const handle = await locator.first().elementHandle();
  if (handle == null) {
    return null;
  }
  return resolveFrameFromElement(page, searchRoot, handle);
}

async function pollContentFrame(page: Page, iframeElement: ElementHandle): Promise<Frame | null> {
  for (let attempt = 0; attempt < CONTENT_FRAME_ATTEMPTS; attempt++) {
    const frame = await iframeElement.contentFrame();
    if (frame != null) {
      return frame;
    }
    await page.waitForTimeout(CONTENT_FRAME_POLL_MS);
  }
  return null;
}

async function resolveByNameOrId(page: Page, iframeElement: ElementHandle): Promise<Frame | null> {
  const name = await iframeElement.getAttribute('name');
  if (name != null && name.trim() !== '') {
    const frame = page.frame(name);
    if (frame != null) {
      return frame;
    }
  }
  const frameId = await iframeElement.getAttribute('id');
  if (frameId != null && frameId.trim() !== '') {
    return page.frame(frameId);
  }
  return null;
}

async function findMatchingFrame(page: Page, iframeElement: ElementHandle): Promise<Frame | null> {
  for (const candidate of page.frames()) {
    const candidateElement = await candidate.frameElement();
    if (candidateElement != null && (await sameElement(iframeElement, candidateElement))) {
      return candidate;
    }
  }
  return null;
}

async function sameElement(left: ElementHandle, right: ElementHandle): Promise<boolean> {
  return elementsAreSame(left, right);
}
