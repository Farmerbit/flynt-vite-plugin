# Vite Plugin for WordPress

## Features

- 🔄 Transforms `@wordpress/*` imports into global `wp.*` references
- 📦 Generates dependency manifest for WordPress enqueuing
- 🎨 Generates theme.json from Tailwind CSS configuration (colors, fonts, font sizes, border radius)
- 🔥 Hot Module Replacement (HMR) support for the WordPress editor

## Installation

```bash
npm install @farmerbit/vite-plugin
```

## Usage

Start by adding the base plugin to your Vite config:

```js
// vite.config.js
import { defineConfig } from 'vite';
import { wordpressPlugin } from '@flynt/vite-plugin';

export default defineConfig({
  plugins: [wordpressPlugin()],
});
```

Once you've added the plugin, WordPress dependencies referenced in your code will be transformed into global `wp.*` references.

When WordPress dependencies are transformed, a manifest containing the required dependencies will be generated called `editor.deps.json`.

### External Mappings for Third-Party Plugins

The plugin can also handle third-party WordPress plugins that expose global JavaScript APIs, such as Advanced Custom Fields (ACF) or WooCommerce. This allows you to import these dependencies in your code while ensuring they're treated as external dependencies and properly enqueued by WordPress.

```js
// vite.config.js
import { defineConfig } from 'vite';
import { wordpressPlugin } from '@farmerbit/vite-plugin';

export default defineConfig({
  plugins: [
    wordpressPlugin({
      externalMappings: {
        'acf-input': {
          global: ['acf', 'input'],
          handle: 'acf-input',
        },
        'woocommerce-blocks': {
          global: ['wc', 'blocks'],
          handle: 'wc-blocks',
        },
      },
    }),
  ],
});
```

With this configuration, you can import from these packages in your code:

```js
import { Field, FieldGroup } from 'acf-input';
import { registerBlockType } from 'woocommerce-blocks';
```

The plugin will transform these imports into global references:

```js
const Field = acf.input.Field;
const FieldGroup = acf.input.FieldGroup;
const registerBlockType = wc.blocks.registerBlockType;
```

The `handle` value is added to the dependency manifest (`editor.deps.json`) so WordPress knows to enqueue these scripts before your code runs.

### Editor HMR Support

The plugin automatically enables CSS Hot Module Replacement (HMR) for the WordPress editor.

> [!NOTE]
> JavaScript HMR is not supported at this time. JS changes will trigger a full page reload.

You can customize the HMR behavior in your Vite config:

```js
// vite.config.js
import { defineConfig } from 'vite';
import { wordpressPlugin } from '@farmerbit/vite-plugin';

export default defineConfig({
  plugins: [
    wordpressPlugin({
      hmr: {
        // Enable/disable HMR (default: true)
        enabled: true,

        // Pattern to match editor entry points (default: /editor/)
        editorPattern: /editor/,

        // Name of the editor iframe element (default: 'editor-canvas')
        iframeName: 'editor-canvas',
      },
    }),
  ],
});
```

### Theme.json Generation

When using this plugin for theme development, you have the option of generating a `theme.json` file from your Tailwind CSS configuration.

To enable this feature, add the `wordpressThemeJson` plugin to your Vite config:

```js
// vite.config.js
import { defineConfig } from 'vite';
import { wordpressThemeJson } from '@farmerbit/vite-plugin';

export default defineConfig({
  plugins: [
    wordpressThemeJson({
      // Optional: Configure shade labels
      shadeLabels: {
        100: 'Lightest',
        900: 'Darkest',
      },

      // Optional: Configure font family labels
      fontLabels: {
        sans: 'Sans Serif',
        mono: 'Monospace',
        inter: 'Inter Font',
      },

      // Optional: Configure font size labels
      fontSizeLabels: {
        sm: 'Small',
        base: 'Default',
        lg: 'Large',
      },

      // Optional: Configure border radius labels
      borderRadiusLabels: {
        sm: 'Small',
        md: 'Medium',
        lg: 'Large',
        full: 'Full',
      },

      // Optional: Disable specific transformations
      disableTailwindColors: false,
      disableTailwindFonts: false,
      disableTailwindFontSizes: false,
      disableTailwindBorderRadius: false,

      // Optional: Configure paths
      baseThemeJsonPath: './theme.json',
      outputPath: 'assets/theme.json',
      cssFile: 'main.scss',

      // Optional: Legacy Tailwind v3 config path
      tailwindConfig: './tailwind.config.js',
    }),
  ],
});
```

By default, Tailwind v4 will only [generate CSS variables](https://tailwindcss.com/docs/theme#generating-all-css-variables) that are discovered in your source files.

To generate the full default Tailwind color palette into your `theme.json`, you can use the `static` theme option when importing Tailwind:

```css
@import 'tailwindcss' theme(static);
```

The same applies for customized colors in the `@theme` directive. To ensure your colors get generated, you can use another form of the `static` theme option:

```css
@theme static {
  --color-white: #fff;
  --color-purple: #3f3cbb;
  --color-midnight: #121063;
  --color-tahiti: #3ab7bf;
  --color-bermuda: #78dcca;
}
```
