import type { FontSize } from '../types.js';
/**
 * Process Tailwind font sizes into theme.json format.
 */
export declare function processFontSizes(sizes: Record<string, string | [string, Record<string, string>]>, fontSizeLabels?: Record<string, string>): FontSize[];
/**
 * Sort font sizes from smallest to largest.
 */
export declare function sortFontSizes(fontSizes: FontSize[]): FontSize[];
/**
 * Resolve font sizes from @theme variables and Tailwind config.
 */
export declare function resolveFontSizes(variables: Array<[string, string]>, tailwindSizes: Record<string, string | [string, Record<string, string>]> | undefined, fontSizeLabels?: Record<string, string>): FontSize[];
