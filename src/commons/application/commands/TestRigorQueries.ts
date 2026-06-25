import { quotedSegment } from './StepEscaping.js';
import type { TestRigorCommandDriver } from './TestRigorCommandDriver.js';

/**
 * Query facade for commands that return values.
 * Element parameters follow https://testrigor.com/docs/language#referencing
 */
export class TestRigorQueries {
  private constructor(private readonly driver: TestRigorCommandDriver) {}

  static queries(driver: TestRigorCommandDriver): TestRigorQueries {
    return new TestRigorQueries(driver);
  }

  static with(driver: TestRigorCommandDriver): TestRigorQueries {
    return TestRigorQueries.queries(driver);
  }

  grabValue(): ContextualGrab;
  grabValue(elementDescription: string): Promise<string> | string;
  grabValue(elementType: string, elementDescription: string): Promise<string> | string;
  grabValue(
    elementDescriptionOrType?: string,
    elementDescription?: string,
  ): ContextualGrab | Promise<string> | string {
    if (elementDescriptionOrType === undefined) {
      return new ContextualGrab(this, null, null, null, null, null, null, null, null);
    }
    if (elementDescription === undefined) {
      return this.driver.grabValue(elementDescriptionOrType);
    }
    return this.driver.grabValue(
      `grab value from ${normalizeElementType(elementDescriptionOrType)} ${quotedSegment(elementDescription)}`,
    );
  }

  grabValueFrom(elementDescription: string): ContextualGrab {
    return new ContextualGrab(this, elementDescription, null, null, null, null, null, null, null);
  }

  grabValueByTemplate(template: string): GrabByTemplate;
  grabValueByTemplate(template: string, elementDescription: string): Promise<string> | string;
  grabValueByTemplate(
    template: string,
    elementType: string,
    elementDescription: string,
  ): Promise<string> | string;
  grabValueByTemplate(
    template: string,
    second?: string,
    third?: string,
  ): GrabByTemplate | Promise<string> | string {
    if (second === undefined) {
      return new GrabByTemplate(this, template);
    }
    if (third === undefined) {
      return this.driver.grabValue(
        `grab value of template ${quotedSegment(template)} from ${quotedSegment(second)}`,
      );
    }
    return this.driver.grabValue(
      `grab value of template ${quotedSegment(template)} from ${normalizeElementType(second)} ${quotedSegment(third)}`,
    );
  }

  grabValueByTemplateFromPage(template: string): Promise<string> | string {
    return this.driver.grabValue(`grab value of template ${quotedSegment(template)}`);
  }

  grabValueOfRegex(regex: string): Promise<string> | string;
  grabValueOfRegex(regex: string, elementDescription: string): Promise<string> | string;
  grabValueOfRegex(
    regex: string,
    elementType: string,
    elementDescription: string,
  ): Promise<string> | string;
  grabValueOfRegex(regex: string, second?: string, third?: string): Promise<string> | string {
    if (second === undefined) {
      return this.driver.grabValue(`grab value of regex ${quotedSegment(regex)}`);
    }
    if (third === undefined) {
      return this.driver.grabValue(
        `grab value of regex ${quotedSegment(regex)} from ${quotedSegment(second)}`,
      );
    }
    return this.driver.grabValue(
      `grab value of regex ${quotedSegment(regex)} from ${normalizeElementType(second)} ${quotedSegment(third)}`,
    );
  }

  grabValueByRegex(regex: string, elementDescription: string): Promise<string> | string {
    return this.grabValueOfRegex(regex, elementDescription);
  }

  grabValueOfAttribute(attribute: string, elementDescription: string): Promise<string> | string {
    return this.driver.grabValue(
      `grab value of attribute ${quotedSegment(attribute)} from ${quotedSegment(elementDescription)}`,
    );
  }

  grabValueOfCssProperty(
    cssProperty: string,
    elementDescription: string,
  ): Promise<string> | string {
    return this.driver.grabValue(
      `grab value of css property ${quotedSegment(cssProperty)} from ${quotedSegment(elementDescription)}`,
    );
  }

  async grabValuesFromTableAtFirstColumn(tableDescription: string): Promise<string[]> {
    const raw = await this.driver.grabValue(
      `grab values from table ${quotedSegment(tableDescription)} at first column`,
    );
    return parseListResult(raw);
  }

  async grabValuesFromTableAtFirstRow(tableDescription: string): Promise<string[]> {
    const raw = await this.driver.grabValue(
      `grab values from table ${quotedSegment(tableDescription)} at first row`,
    );
    return parseListResult(raw);
  }

  /** @internal */
  runGrab(elementDescription: string): Promise<string> | string {
    return this.driver.grabValue(elementDescription);
  }
}

export class GrabByTemplate {
  constructor(
    private readonly parent: TestRigorQueries,
    private readonly template: string,
  ) {}

  from(elementDescription: string): Promise<string> | string {
    return this.parent.grabValueByTemplate(this.template, elementDescription) as
      | Promise<string>
      | string;
  }
}

export class ContextualGrab {
  constructor(
    private readonly parent: TestRigorQueries,
    private readonly elementDescription: string | null,
    private readonly elementType: string | null,
    private readonly tableDescription: string | null,
    private readonly rowContainingValue: string | null,
    private readonly columnDescription: string | null,
    private readonly contextDescription: string | null,
    private readonly belowAnchor: Anchor | null,
    private readonly rightAnchor: Anchor | null,
  ) {}

  ofType(elementType: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      normalizeElementType(elementType),
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  withinTable(tableDescription: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  rowContaining(rowContaining: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      this.tableDescription,
      rowContaining,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  column(columnDescription: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      this.tableDescription,
      this.rowContainingValue,
      columnDescription,
      this.contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  inContext(contextDescription: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      contextDescription,
      this.belowAnchor,
      this.rightAnchor,
    );
  }

  below(anchorDescription: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.below(anchorDescription),
      this.rightAnchor,
    );
  }

  roughlyBelow(anchorDescription: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.roughlyBelow(anchorDescription),
      this.rightAnchor,
    );
  }

  completelyBelow(anchorDescription: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      Anchor.completelyBelow(anchorDescription),
      this.rightAnchor,
    );
  }

  rightOf(anchorDescription: string): ContextualGrab {
    return new ContextualGrab(
      this.parent,
      this.elementDescription,
      this.elementType,
      this.tableDescription,
      this.rowContainingValue,
      this.columnDescription,
      this.contextDescription,
      this.belowAnchor,
      Anchor.rightOf(anchorDescription),
    );
  }

  and(): ContextualGrab {
    return this;
  }

  get(): Promise<string> | string {
    return this.parent.runGrab(this.renderElementDescription());
  }

  byTemplate(template: string): Promise<string> | string {
    return this.parent.runGrab(this.buildTemplateStep(template));
  }

  byRegex(regex: string): Promise<string> | string {
    return this.parent.runGrab(this.buildRegexStep(regex));
  }

  private renderElementDescription(): string {
    const baseDescriptor = this.elementType ?? 'element';
    let line = baseDescriptor;
    if (this.tableDescription != null) {
      line += ` within the context of table ${quotedSegment(this.tableDescription)}`;
      if (this.rowContainingValue != null) {
        line += ` at row containing ${quotedSegment(this.rowContainingValue)}`;
      }
      if (this.columnDescription != null) {
        line += this.rowContainingValue != null ? ' and' : ' at';
        line += ` column ${quotedSegment(this.columnDescription)}`;
      }
    } else if (this.contextDescription != null) {
      line += ` within the context of ${quotedSegment(this.contextDescription)}`;
    }

    if (this.belowAnchor != null) {
      line += ` ${this.belowAnchor.render()}`;
    }
    if (this.rightAnchor != null) {
      line +=
        this.belowAnchor == null
          ? ` ${this.rightAnchor.render()}`
          : ` and ${this.rightAnchor.render()}`;
    }

    if (line === baseDescriptor) {
      if (this.elementDescription == null) {
        return baseDescriptor;
      }
      if (this.elementType != null) {
        return `${this.elementType} ${quotedSegment(this.elementDescription)}`;
      }
      return this.elementDescription;
    }
    if (this.elementDescription == null || this.elementDescription.trim() === '') {
      return line;
    }
    line += ` containing ${quotedSegment(this.elementDescription)}`;
    return line;
  }

  private renderContextOnly(): string {
    let line = '';
    if (this.tableDescription != null) {
      line += `within the context of table ${quotedSegment(this.tableDescription)}`;
      if (this.rowContainingValue != null) {
        line += ` at row containing ${quotedSegment(this.rowContainingValue)}`;
      }
      if (this.columnDescription != null) {
        line += this.rowContainingValue != null ? ' and' : ' at';
        line += ` column ${quotedSegment(this.columnDescription)}`;
      }
    } else if (this.contextDescription != null) {
      line += `within the context of ${quotedSegment(this.contextDescription)}`;
    }

    if (this.belowAnchor != null) {
      if (line.length > 0) {
        line += ' ';
      }
      line += this.belowAnchor.render();
    }
    if (this.rightAnchor != null) {
      if (line.length > 0) {
        line += this.belowAnchor != null ? ' and ' : ' ';
      }
      line += this.rightAnchor.render();
    }
    if (this.elementType != null && this.elementType.trim() !== '') {
      if (line.length > 0) {
        line = `${this.elementType} ${line}`;
      } else {
        line += this.elementType;
      }
    }
    if (
      line.length > 0 &&
      this.elementDescription != null &&
      this.elementDescription.trim() !== ''
    ) {
      line += ` containing ${quotedSegment(this.elementDescription)}`;
    }
    return line;
  }

  private buildRegexStep(regex: string): string {
    const context = this.renderContextOnly();
    if (context.trim() !== '') {
      if (this.elementType != null) {
        return `grab value of regex ${quotedSegment(regex)} from ${context}`;
      }
      return `grab value of regex ${quotedSegment(regex)} from element ${context}`;
    }
    if (this.elementDescription == null || this.elementDescription.trim() === '') {
      return `grab value of regex ${quotedSegment(regex)}`;
    }
    if (this.elementType != null) {
      return `grab value of regex ${quotedSegment(regex)} from ${this.elementType} ${quotedSegment(this.elementDescription)}`;
    }
    return `grab value of regex ${quotedSegment(regex)} from ${quotedSegment(this.elementDescription)}`;
  }

  private buildTemplateStep(template: string): string {
    const context = this.renderContextOnly();
    if (context.trim() !== '') {
      if (this.elementType != null) {
        return `grab value of template ${quotedSegment(template)} from ${context}`;
      }
      return `grab value of template ${quotedSegment(template)} from element ${context}`;
    }
    if (this.elementDescription == null || this.elementDescription.trim() === '') {
      return `grab value of template ${quotedSegment(template)}`;
    }
    if (this.elementType != null) {
      return `grab value of template ${quotedSegment(template)} from ${this.elementType} ${quotedSegment(this.elementDescription)}`;
    }
    return `grab value of template ${quotedSegment(template)} from ${quotedSegment(this.elementDescription)}`;
  }
}

class Anchor {
  private constructor(
    private readonly relationPrefix: string,
    private readonly anchorDescription: string,
  ) {}

  static below(anchorDescription: string): Anchor {
    return new Anchor('below ', anchorDescription);
  }

  static roughlyBelow(anchorDescription: string): Anchor {
    return new Anchor('roughly below ', anchorDescription);
  }

  static completelyBelow(anchorDescription: string): Anchor {
    return new Anchor('completely below ', anchorDescription);
  }

  static rightOf(anchorDescription: string): Anchor {
    return new Anchor('to the right of ', anchorDescription);
  }

  render(): string {
    return this.relationPrefix + quotedSegment(this.anchorDescription);
  }
}

function normalizeElementType(elementType: string): string {
  if (elementType == null || elementType.trim() === '') {
    throw new Error('Element type must not be blank');
  }
  return elementType.trim().toLowerCase();
}

function parseListResult(raw: string | null | undefined): string[] {
  if (raw == null || raw.trim() === '') {
    return [];
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const content = trimmed.substring(1, trimmed.length - 1).trim();
    if (content === '') {
      return [];
    }
    return content
      .split(/\s*,\s*/)
      .map((value) => value.trim())
      .filter((value) => value !== '');
  }
  return trimmed
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter((value) => value !== '');
}
