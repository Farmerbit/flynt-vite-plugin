/**
 * Extract the content of an @theme block.
 */
export declare function extractThemeContent(css: string): string | null;
/**
 * Extract CSS variable name/value pairs from a theme block.
 */
export declare function extractVariables(regex: RegExp, content: string | null): Array<[string, string]>;
