import type { ElementHandle, Frame, Locator, Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import {
  resolveFrameByIndex,
  resolveFrameByName,
  resolveFrameFromElement,
} from './frame-resolver.js';

describe('PlaywrightFrameResolver', () => {
  it('resolveFromElement uses contentFrame when available', async () => {
    const page = {
      waitForTimeout: vi.fn(),
    } as unknown as Page;
    const searchRoot = {} as Frame;
    const childFrame = {} as Frame;
    const iframe = {
      scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      contentFrame: vi.fn().mockResolvedValue(childFrame),
    } as unknown as ElementHandle;

    await expect(resolveFrameFromElement(page, searchRoot, iframe)).resolves.toBe(childFrame);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('resolveFromElement falls back to frame element match', async () => {
    const page = {
      frames: vi.fn().mockReturnValue([]),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    const searchRoot = {} as Frame;
    const matchedFrame = {
      frameElement: vi.fn(),
    } as unknown as Frame;
    const matchedElement = {} as ElementHandle;
    const iframe = {
      scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      contentFrame: vi.fn().mockResolvedValue(null),
      getAttribute: vi.fn().mockResolvedValue(null),
      evaluate: vi.fn().mockResolvedValue(false),
    } as unknown as ElementHandle;

    page.frames = vi.fn().mockReturnValue([matchedFrame]);
    matchedFrame.frameElement = vi.fn().mockResolvedValue(matchedElement);
    iframe.evaluate = vi.fn().mockImplementation((_script, other) => {
      return Promise.resolve(other === matchedElement);
    });

    await expect(resolveFrameFromElement(page, searchRoot, iframe)).resolves.toBe(matchedFrame);
  });

  it('resolveFromElement falls back to frame name', async () => {
    const namedFrame = {} as Frame;
    const page = {
      frame: vi.fn().mockReturnValue(namedFrame),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    const searchRoot = {} as Frame;
    const iframe = {
      scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      contentFrame: vi.fn().mockResolvedValue(null),
      getAttribute: vi.fn().mockImplementation((name: string) => {
        return Promise.resolve(name === 'name' ? 'content' : null);
      }),
    } as unknown as ElementHandle;

    await expect(resolveFrameFromElement(page, searchRoot, iframe)).resolves.toBe(namedFrame);
    expect(page.frame).toHaveBeenCalledWith('content');
  });

  it('resolveByIndex uses nth iframe in current frame', async () => {
    const page = {
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    const childFrame = {} as Frame;
    const iframe = {
      scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      contentFrame: vi.fn().mockResolvedValue(childFrame),
    } as unknown as ElementHandle;
    const nth = {
      elementHandle: vi.fn().mockResolvedValue(iframe),
    } as unknown as Locator;
    const iframes = {
      count: vi.fn().mockResolvedValue(2),
      nth: vi.fn().mockReturnValue(nth),
    } as unknown as Locator;
    const searchRoot = {
      locator: vi.fn().mockReturnValue(iframes),
      page: vi.fn().mockReturnValue(page),
    } as unknown as Frame;

    await expect(resolveFrameByIndex(searchRoot, 1)).resolves.toBe(childFrame);
  });

  it('resolveByName uses page frame lookup', async () => {
    const namedFrame = {} as Frame;
    const page = {
      frame: vi.fn().mockReturnValue(namedFrame),
    } as unknown as Page;
    const searchRoot = {} as Frame;

    await expect(resolveFrameByName(page, searchRoot, 'sidebar')).resolves.toBe(namedFrame);
  });
});
