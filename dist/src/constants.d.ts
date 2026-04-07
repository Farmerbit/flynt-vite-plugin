/**
 * WordPress packages that are bundled and should NOT be externalized.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dependency-extraction-webpack-plugin/lib/util.js
 */
export declare const EXEMPT_PACKAGES: readonly ["@wordpress/admin-ui", "@wordpress/dataviews", "@wordpress/dataviews/wp", "@wordpress/icons", "@wordpress/interface", "@wordpress/undo-manager", "@wordpress/fields", "@wordpress/views", "@wordpress/ui"];
/**
 * CSS-wide keywords to exclude from theme values.
 */
export declare const CSS_WIDE_KEYWORDS: readonly ["initial", "inherit", "unset", "revert", "revert-layer"];
/**
 * Font-related CSS properties that should NOT be treated as font families.
 */
export declare const INVALID_FONT_PROPS: readonly ["feature-settings", "variation-settings", "family", "size", "smoothing", "style", "weight", "stretch"];
/**
 * Text-related CSS properties that should NOT be treated as font sizes.
 */
export declare const INVALID_TEXT_PROPS: readonly ["line-height", "letter-spacing", "font-weight", "shadow"];
/**
 * Supported file extensions for WordPress imports transformation
 */
export declare const SUPPORTED_EXTENSIONS: readonly [".js", ".jsx", ".ts", ".tsx", ".mjs"];
/**
 * Regex patterns for extracting CSS custom properties from @theme blocks.
 */
export declare const CSS_VARIABLE_PATTERNS: {
    readonly COLOR: RegExp;
    readonly FONT_FAMILY: RegExp;
    readonly FONT_SIZE: RegExp;
    readonly BORDER_RADIUS: RegExp;
};
