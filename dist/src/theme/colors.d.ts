import type { ColorPalette } from '../types.js';
/**
 * Flatten a nested color object into [name, value] pairs.
 */
export declare function flattenColors(colors: Record<string, unknown>): Array<[string, string]>;
/**
 * Format a color name for the WordPress editor.
 */
export declare function formatColorName(name: string, shadeLabels?: Record<string, string>): string;
/**
 * Resolve colors from @theme variables and Tailwind config.
 */
export declare function resolveColors(themeVariables: Array<[string, string]>, tailwindColors: Record<string, unknown> | undefined, shadeLabels?: Record<string, string>): ColorPalette[];
