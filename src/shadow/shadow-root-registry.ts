import { ShadowRootNotFoundException } from '../errors/shadow-root-not-found-exception.js';
import { ResolvedShadowRoot } from './resolved-shadow-root.js';

export class ShadowRootRegistry {
  static readonly W3C_SHADOW_ROOT_KEY = 'shadow-6066-11e4-a52e-4f735466cecf';
  private static readonly SHADOW_ID_PARAMETER = 'shadowId';

  private counter = 0;
  private readonly shadowRoots = new Map<string, ResolvedShadowRoot>();

  register(shadowRoot: ResolvedShadowRoot): Record<string, string> {
    const id = String(++this.counter);
    this.shadowRoots.set(id, shadowRoot);
    return { [ShadowRootRegistry.W3C_SHADOW_ROOT_KEY]: id };
  }

  resolve(shadowId: string | null | undefined): ResolvedShadowRoot {
    if (shadowId == null || shadowId.trim() === '') {
      throw new Error('Missing shadow root reference');
    }
    const shadowRoot = this.shadowRoots.get(shadowId);
    if (shadowRoot == null) {
      throw new ShadowRootNotFoundException(`Shadow root reference not found: ${shadowId}`);
    }
    return shadowRoot;
  }

  resolveFromParameters(parameters: Record<string, unknown>): ResolvedShadowRoot {
    let rawShadowId: unknown = parameters[ShadowRootRegistry.SHADOW_ID_PARAMETER];
    if (rawShadowId == null) {
      rawShadowId = parameters[ShadowRootRegistry.W3C_SHADOW_ROOT_KEY];
    }
    if (rawShadowId != null && typeof rawShadowId === 'object' && !Array.isArray(rawShadowId)) {
      const nested = rawShadowId as Record<string, unknown>;
      const nestedId = nested[ShadowRootRegistry.W3C_SHADOW_ROOT_KEY];
      if (nestedId != null) {
        return this.resolve(String(nestedId));
      }
    }
    return this.resolve(rawShadowId == null ? null : String(rawShadowId));
  }

  clear(): void {
    this.shadowRoots.clear();
  }
}
