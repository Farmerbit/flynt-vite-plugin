import type { Plugin as VitePlugin } from 'vite';
import type { ThemeJsonConfig } from '../types.js';
/**
 * Generate a WordPress theme.json from Tailwind CSS
 * design tokens and @theme block variables.
 */
export declare function wordpressThemeJson(config?: ThemeJsonConfig): VitePlugin;
