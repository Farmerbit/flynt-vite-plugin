import type { TailwindTheme, TailwindConfig } from '../types.js';
/**
 * Merge base theme with extended theme properties.
 */
export declare function mergeThemeWithExtend(theme: TailwindTheme): TailwindTheme;
/**
 * Load and resolve a Tailwind configuration file.
 */
export declare function loadTailwindConfig(configPath: string): Promise<TailwindConfig>;
