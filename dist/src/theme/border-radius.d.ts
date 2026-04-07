import type { BorderRadiusSize } from '../types.js';
/**
 * Determine if the value is a static CSS border-radius value.
 */
export declare function isStaticRadiusValue(value: string): boolean;
/**
 * Parse a border-radius size to rem for sorting.
 */
export declare function parseRadiusSizeForSort(size: string): number | null;
/**
 * Sort border radius sizes from smallest to largest.
 */
export declare function sortBorderRadiusSizes(sizes: BorderRadiusSize[]): BorderRadiusSize[];
/**
 * Processes border radius sizes from Tailwind config into theme.json format.
 */
export declare function processBorderRadiusSizes(sizes: Record<string, string>, borderRadiusLabels?: Record<string, string>): BorderRadiusSize[];
/**
 * Resolve border radius sizes from @theme variables and Tailwind config.
 */
export declare function resolveBorderRadii(variables: Array<[string, string]>, tailwindRadius: Record<string, string> | undefined, borderRadiusLabels?: Record<string, string>): BorderRadiusSize[];
