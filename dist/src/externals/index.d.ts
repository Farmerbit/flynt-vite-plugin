import type { Plugin as VitePlugin } from 'vite';
import type { WordPressPluginConfig } from '../types.js';
/**
 * Transform WordPress imports into global references and
 * generate a dependency manifest for enqueuing.
 */
export declare function wordpressPlugin(config?: WordPressPluginConfig): VitePlugin;
