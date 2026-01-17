declare module "parse5" {
  export interface Node {
    nodeName: string;
    tagName?: string;
    attrs?: Array<{ name: string; value: string }>;
    childNodes?: Node[];
    parentNode?: Node;
    value?: string;
  }

  export interface DocumentType extends Node {
    name: string;
    publicId: string;
    systemId: string;
  }

  export interface Document extends Node {
    mode: string;
    documentElement: Element;
  }

  export interface Element extends Node {
    namespaceURI: string;
  }

  export interface ParserOptions {
    sourceCodeLocationInfo?: boolean;
    scriptingEnabled?: boolean;
    onParseError?: (error: Error) => void;
    treeAdapter?: any;
  }

  export function parse(html: string, options?: ParserOptions): Document;
  export function parseFragment(
    html: string,
    options?: ParserOptions
  ): DocumentFragment;
  export function serialize(node: Node): string;
}
