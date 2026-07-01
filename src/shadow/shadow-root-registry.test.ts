import type { ElementHandle, JSHandle } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import { ElementNotFoundException } from '../errors/element-not-found-exception.js';
import { ShadowRootNotFoundException } from '../errors/shadow-root-not-found-exception.js';
import { ResolvedShadowRoot } from './resolved-shadow-root.js';
import { ShadowRootRegistry } from './shadow-root-registry.js';

describe('ShadowRootRegistry', () => {
  it('register returns W3C shadow root reference', () => {
    const registry = new ShadowRootRegistry();
    const handle = {} as JSHandle;

    const reference = registry.register(new ResolvedShadowRoot(handle));

    expect(reference).toHaveProperty(ShadowRootRegistry.W3C_SHADOW_ROOT_KEY);
    expect(
      registry.resolve(String(reference[ShadowRootRegistry.W3C_SHADOW_ROOT_KEY])),
    ).toBeDefined();
  });

  it('resolve accepts shadowId parameter', () => {
    const registry = new ShadowRootRegistry();
    const handle = {} as JSHandle;
    const id = String(
      registry.register(new ResolvedShadowRoot(handle))[ShadowRootRegistry.W3C_SHADOW_ROOT_KEY],
    );

    expect(registry.resolve(id).shadowRootHandle()).toBe(handle);
  });

  it('resolve missing reference throws', () => {
    const registry = new ShadowRootRegistry();

    expect(() => registry.resolve('missing')).toThrow(ShadowRootNotFoundException);
  });

  it('resolve accepts nested shadow reference', () => {
    const registry = new ShadowRootRegistry();
    const handle = {} as JSHandle;
    const id = String(
      registry.register(new ResolvedShadowRoot(handle))[ShadowRootRegistry.W3C_SHADOW_ROOT_KEY],
    );

    const parameters = {
      shadowId: { [ShadowRootRegistry.W3C_SHADOW_ROOT_KEY]: id },
      using: 'css selector',
      value: '.child',
    };

    expect(registry.resolveFromParameters(parameters).shadowRootHandle()).toBe(handle);
  });

  it('clear removes registered shadow roots', () => {
    const registry = new ShadowRootRegistry();
    const handle = {} as JSHandle;
    const id = String(
      registry.register(new ResolvedShadowRoot(handle))[ShadowRootRegistry.W3C_SHADOW_ROOT_KEY],
    );

    registry.clear();

    expect(() => registry.resolve(id)).toThrow(ShadowRootNotFoundException);
  });
});

describe('ResolvedShadowRoot', () => {
  it('fromHost returns shadow root when present', async () => {
    const host = {
      evaluateHandle: vi.fn(),
    } as unknown as ElementHandle;
    const shadowRoot = {
      evaluate: vi.fn().mockResolvedValue({}),
    } as unknown as JSHandle;
    host.evaluateHandle = vi.fn().mockResolvedValue(shadowRoot);

    const resolved = await ResolvedShadowRoot.fromHost(host);

    expect(resolved.shadowRootHandle()).toBe(shadowRoot);
  });

  it('fromHost throws when shadow root missing', async () => {
    const host = {
      evaluateHandle: vi.fn(),
    } as unknown as ElementHandle;
    const shadowRoot = {
      evaluate: vi.fn().mockResolvedValue(null),
    } as unknown as JSHandle;
    host.evaluateHandle = vi.fn().mockResolvedValue(shadowRoot);

    await expect(ResolvedShadowRoot.fromHost(host)).rejects.toThrow(ShadowRootNotFoundException);
  });

  it('findElement uses css selector', async () => {
    const element = {} as ElementHandle;
    const resultHandle = {
      asElement: vi.fn().mockReturnValue(element),
    } as unknown as JSHandle;
    const shadowRoot = {
      evaluateHandle: vi.fn().mockResolvedValue(resultHandle),
    } as unknown as JSHandle;

    const found = await new ResolvedShadowRoot(shadowRoot).findElement('css selector', '.item');

    expect(found).toBe(element);
    expect(shadowRoot.evaluateHandle).toHaveBeenCalledWith(expect.any(Function), '.item');
  });

  it('findElements uses xpath', async () => {
    const first = { asElement: vi.fn().mockReturnValue({}) } as unknown as JSHandle;
    const second = { asElement: vi.fn().mockReturnValue({}) } as unknown as JSHandle;
    const arrayHandle = {
      getProperties: vi.fn().mockResolvedValue(
        new Map([
          ['0', first],
          ['1', second],
        ]),
      ),
      dispose: vi.fn().mockResolvedValue(undefined),
    } as unknown as JSHandle;
    const shadowRoot = {
      evaluateHandle: vi.fn().mockResolvedValue(arrayHandle),
    } as unknown as JSHandle;

    const found = await new ResolvedShadowRoot(shadowRoot).findElements('xpath', '//button');

    expect(found).toHaveLength(2);
    expect(shadowRoot.evaluateHandle).toHaveBeenCalledWith(expect.any(Function), '//button');
  });

  it('findElement throws when not found', async () => {
    const resultHandle = {
      asElement: vi.fn().mockReturnValue(null),
    } as unknown as JSHandle;
    const shadowRoot = {
      evaluateHandle: vi.fn().mockResolvedValue(resultHandle),
    } as unknown as JSHandle;

    await expect(
      new ResolvedShadowRoot(shadowRoot).findElement('css selector', '.missing'),
    ).rejects.toThrow(ElementNotFoundException);
  });
});
