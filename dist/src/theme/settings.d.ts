import type { ThemeJsonSettings, ColorPalette, FontFamily, FontSize, BorderRadiusSize } from '../types.js';
/**
 * Deduplicate entries by slug, keeping the first occurrence.
 */
export declare function dedupeBySlug<T extends {
    slug: string;
}>(entries: T[]): T[];
/**
 * Build the theme.json settings from base settings and generated entries.
 */
export declare function buildSettings(params: {
    baseSettings: ThemeJsonSettings;
    colors: ColorPalette[] | undefined;
    fonts: FontFamily[] | undefined;
    fontSizes: FontSize[] | undefined;
    borderRadii: BorderRadiusSize[] | undefined;
    disabled: {
        colors?: boolean;
        fonts?: boolean;
        fontSizes?: boolean;
        borderRadius?: boolean;
    };
}): ThemeJsonSettings;
