import type { FontFamily } from '../types.js';
/**
 * Process Tailwind font families into theme.json format.
 */
export declare function processFontFamilies(fonts: Record<string, string[] | string>, fontLabels?: Record<string, string>): FontFamily[];
/**
 * Resolve font families from @theme variables and Tailwind config.
 */
export declare function resolveFonts(variables: Array<[string, string]>, tailwindFonts: Record<string, string[] | string> | undefined, fontLabels?: Record<string, string>): FontFamily[];
