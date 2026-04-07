/**
 * Generate the HMR snippet for CSS hot-reloading in the editor iframe.
 */
export declare function createHmrCode(iframeName: string): string;
/**
 * Determine whether HMR code should be injected into the given module.
 */
export declare function shouldInjectHmr(code: string, id: string, config: {
    enabled: boolean;
    editorPattern: string | RegExp;
}): boolean;
