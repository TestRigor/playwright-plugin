import type { ElementHandle, Frame, JSHandle } from 'playwright';

export function readPageSource(frame: Frame): Promise<string> {
  return frame.evaluate(() => {
    const doc = document;
    if (!doc?.documentElement) {
      return '';
    }
    let source = doc.documentElement.outerHTML;
    if (!source) {
      source = new XMLSerializer().serializeToString(doc);
    }
    return source;
  });
}

export async function documentActiveElement(frame: Frame): Promise<ElementHandle> {
  const handle = await frame.evaluateHandle(() => document.activeElement);
  const element = handle.asElement();
  if (element == null) {
    throw new Error('No active element');
  }
  return element;
}

export function submitElement(element: ElementHandle): Promise<void> {
  return element.evaluate((el) => {
    if (typeof (el as HTMLFormElement).submit === 'function') {
      (el as HTMLFormElement).submit();
    }
  });
}

export function readElementProperty(element: ElementHandle, name: string): Promise<unknown> {
  return element.evaluate(
    (el, propertyName) => (el as unknown as Record<string, unknown>)[propertyName],
    name,
  );
}

export function readElementCssProperty(element: ElementHandle, name: string): Promise<string> {
  return element.evaluate(
    (el, propertyName) => getComputedStyle(el as Element).getPropertyValue(propertyName),
    name,
  );
}

export function readElementTagName(element: ElementHandle): Promise<string> {
  return element.evaluate((el) => (el as Element).tagName.toLowerCase());
}

export function isElementSelected(element: ElementHandle): Promise<boolean> {
  return element.evaluate((el) =>
    'checked' in el
      ? Boolean((el as HTMLInputElement).checked)
      : Boolean((el as HTMLOptionElement).selected),
  );
}

export function findChildByXpath(
  element: ElementHandle,
  xpath: string,
): Promise<ElementHandle | null> {
  return element
    .evaluateHandle(
      (el, expression) =>
        document.evaluate(expression, el, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
          .singleNodeValue,
      xpath,
    )
    .then((handle) => handle.asElement());
}

export function elementsAreSame(left: ElementHandle, right: ElementHandle): Promise<boolean> {
  return left.evaluate((self, other) => self === other, right);
}

export function hostShadowRoot(host: ElementHandle): Promise<JSHandle> {
  return host.evaluateHandle((el) => (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot);
}

export function shadowRootQuerySelector(shadowRoot: JSHandle, selector: string): Promise<JSHandle> {
  return shadowRoot.evaluateHandle(
    (root, cssSelector) => (root as ShadowRoot | null)?.querySelector(cssSelector) ?? null,
    selector,
  );
}

export function shadowRootQuerySelectorAll(
  shadowRoot: JSHandle,
  selector: string,
): Promise<JSHandle> {
  return shadowRoot.evaluateHandle(
    (root, cssSelector) =>
      Array.from((root as ShadowRoot | null)?.querySelectorAll(cssSelector) ?? []),
    selector,
  );
}

export function shadowRootFindByXpath(shadowRoot: JSHandle, xpath: string): Promise<JSHandle> {
  return shadowRoot.evaluateHandle((root, expression) => {
    if (root == null) {
      return null;
    }
    return document.evaluate(
      expression,
      root as Node,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
  }, xpath);
}

export function shadowRootFindAllByXpath(shadowRoot: JSHandle, xpath: string): Promise<JSHandle> {
  return shadowRoot.evaluateHandle((root, expression) => {
    if (root == null) {
      return [];
    }
    const result = document.evaluate(
      expression,
      root as Node,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    const nodes: Node[] = [];
    for (let index = 0; index < result.snapshotLength; index++) {
      const item = result.snapshotItem(index);
      if (item != null) {
        nodes.push(item);
      }
    }
    return nodes;
  }, xpath);
}
