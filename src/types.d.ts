declare module "@postlight/parser" {
  interface ExtractOptions {
    headers?: Record<string, string>;
    html?: string;
    fallback?: boolean;
    contentType?: string;
  }

  interface ExtractResult {
    title?: string;
    content?: string;
    author?: string;
    date_published?: string;
    dek?: string;
    lead_image_url?: string;
    excerpt?: string;
    word_count?: number;
    direction?: string;
    total_pages?: number;
    rendered_pages?: number;
    next_page_url?: string;
    url?: string;
    domain?: string;
  }

  interface ParserInterface {
    parse(url: string, options?: ExtractOptions): Promise<ExtractResult | null>;
    browser(): unknown;
    fetchResource(url: string): Promise<unknown>;
    addExtractor(extractor: unknown): void;
  }

  const parser: ParserInterface;
  export default parser;
}
