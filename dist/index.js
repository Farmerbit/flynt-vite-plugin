// src/externals/index.ts
import {
  defaultRequestToExternal,
  defaultRequestToHandle
} from "@wordpress/dependency-extraction-webpack-plugin/lib/util";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// src/constants.ts
var EXEMPT_PACKAGES = [
  "@wordpress/admin-ui",
  "@wordpress/dataviews",
  "@wordpress/dataviews/wp",
  "@wordpress/icons",
  "@wordpress/interface",
  "@wordpress/undo-manager",
  "@wordpress/fields",
  "@wordpress/views",
  "@wordpress/ui"
];
var CSS_WIDE_KEYWORDS = [
  "initial",
  "inherit",
  "unset",
  "revert",
  "revert-layer"
];
var INVALID_FONT_PROPS = [
  "feature-settings",
  "variation-settings",
  "family",
  "size",
  "smoothing",
  "style",
  "weight",
  "stretch"
];
var INVALID_TEXT_PROPS = [
  "line-height",
  "letter-spacing",
  "font-weight",
  "shadow"
];
var SUPPORTED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs"];
var CSS_VARIABLE_PATTERNS = {
  COLOR: /(?:^|[;{}])\s*--color-([^:]+):\s*([^;}]+)/gm,
  FONT_FAMILY: /(?:^|[;{}])\s*--font-([^:]+):\s*([^;}]+)/gm,
  FONT_SIZE: /(?:^|[;{}])\s*--text-([^:]+):\s*([^;}]+)/gm,
  BORDER_RADIUS: /(?:^|[;{}])\s*--radius-([^:]+):\s*([^;}]+)/gm
};

// src/utils.ts
function convertToRem(size) {
  size = size.trim().toLowerCase();
  if (size.endsWith("px")) {
    return parseFloat(size) / 16;
  }
  if (size.endsWith("em") || size.endsWith("rem")) {
    return parseFloat(size);
  }
  return 0;
}
function isExemptPackage(id) {
  return EXEMPT_PACKAGES.includes(id);
}
function isCssWideKeyword(value) {
  return CSS_WIDE_KEYWORDS.includes(value);
}

// src/externals/transform.ts
function extractNamedImports(imports) {
  const match = imports.match(/{([^}]+)}/);
  return match?.[1]?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
}
function handleNamedReplacement(namedImports, external) {
  const externalPath = external.join(".");
  return namedImports.map((importStr) => {
    const parts = importStr.split(" as ").map((s) => s.trim());
    const name = parts[0];
    const alias = parts[1] ?? name;
    return `const ${alias} = ${externalPath}.${name};`;
  }).join("\n");
}
function resolveImport(imports, globalPath) {
  if (!imports) return null;
  if (imports.includes("{")) {
    return handleNamedReplacement(extractNamedImports(imports), globalPath);
  }
  if (imports.includes("*")) {
    const namespaceAlias = imports.match(/\*\s+as\s+(\w+)/)?.[1];
    if (namespaceAlias) {
      return `const ${namespaceAlias} = ${globalPath.join(".")};`;
    }
  } else {
    const defaultImport = imports.match(/^(\w+)/)?.[1];
    if (defaultImport) {
      return `const ${defaultImport} = ${globalPath.join(".")};`;
    }
  }
  return null;
}

// src/externals/hmr.ts
function createHmrCode(iframeName) {
  return `
if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', ({ updates }) => {
        const editorIframe = document.querySelector('iframe[name="${iframeName}"]');
        const editor = editorIframe?.contentDocument;

        if (!editor) {
            return;
        }

        updates.forEach(({ path, type }) => {
            if (type !== 'css-update') {
                return;
            }

            const key = path.split('?')[0];

            editor.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                if (!link.href.includes(key)) {
                    return;
                }

                const updated = link.href.split('?')[0] + '?direct&t=' + Date.now();

                link.href = updated;
            });

            editor.querySelectorAll('style').forEach(style => {
                if (!style.textContent.includes(key)) {
                    return;
                }

                const importRegex = new RegExp(\`(@import\\\\s*(?:url\\\\(['"]?|['"]))(.*?\${key}[^'"\\\\)]*?)(?:\\\\?[^'"\\\\)]*)?(['"]?\\\\))\`, 'g');

                style.textContent = style.textContent.replace(importRegex, (_, prefix, importPath, suffix) => {
                    const updated = importPath.split('?')[0];

                    return prefix + updated + '?direct&t=' + Date.now() + suffix;
                });
            });
        });
    });
}`;
}
function shouldInjectHmr(code, id, config) {
  if (!config.enabled) return false;
  if (code.includes("vite:beforeUpdate")) return false;
  if (typeof config.editorPattern === "string") {
    return id.includes(config.editorPattern);
  }
  return config.editorPattern.test(id);
}

// src/externals/index.ts
function wordpressPlugin(config = {}) {
  const extensions = config.extensions ?? SUPPORTED_EXTENSIONS;
  const externalMappings = config.externalMappings ?? {};
  const dependencies = /* @__PURE__ */ new Set();
  const hmrConfig = {
    enabled: true,
    editorPattern: /editor/,
    iframeName: "editor-canvas",
    ...config.hmr
  };
  const hmrCode = createHmrCode(hmrConfig.iframeName);
  let outDir = "";
  let isServe = false;
  let lastWrittenDeps = "";
  function writeDepsToDisk() {
    const json = JSON.stringify([...dependencies], null, 2);
    if (json === lastWrittenDeps) return;
    lastWrittenDeps = json;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "editor.deps.json"), json);
  }
  return {
    name: "wordpress-plugin",
    enforce: "pre",
    configResolved(resolvedConfig) {
      outDir = resolvedConfig.build.outDir;
      isServe = resolvedConfig.command === "serve";
    },
    configureServer() {
      writeDepsToDisk();
    },
    options(opts) {
      return {
        ...opts,
        external: (id) => {
          if (typeof id !== "string") return false;
          if (id in externalMappings) {
            return true;
          }
          return id.startsWith("@wordpress/") && !isExemptPackage(id);
        }
      };
    },
    resolveId(id) {
      if (id in externalMappings) {
        const mapping = externalMappings[id];
        dependencies.add(mapping.handle);
        return { id, external: true };
      }
      if (!id?.startsWith("@wordpress/") || isExemptPackage(id)) return null;
      const [external, handle] = [
        defaultRequestToExternal(id),
        defaultRequestToHandle(id)
      ];
      if (!external || !handle) return null;
      dependencies.add(handle);
      return { id, external: true };
    },
    transform(code, id) {
      const cleanId = id.split("?")[0];
      if (!extensions.some((ext) => cleanId.endsWith(ext))) return null;
      let transformedCode = code;
      for (const [packageName, mapping] of Object.entries(externalMappings)) {
        const customImportRegex = new RegExp(
          `^[\\s\\n]*import[\\s\\n]+(?:([^;'"]+?)[\\s\\n]+from[\\s\\n]+)?['"]${packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"][\\s\\n]*;?`,
          "gm"
        );
        let match2;
        while ((match2 = customImportRegex.exec(code)) !== null) {
          const [fullMatch, imports] = match2;
          dependencies.add(mapping.handle);
          const replacement = resolveImport(imports, mapping.global);
          if (replacement) {
            transformedCode = transformedCode.replace(fullMatch, replacement);
          } else {
            transformedCode = transformedCode.replace(fullMatch, "");
          }
        }
      }
      const importRegex = /^[\s\n]*import[\s\n]+(?:([^;'"]+?)[\s\n]+from[\s\n]+)?['"]@wordpress\/([^'"]+)['"][\s\n]*;?/gm;
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        const [fullMatch, imports, pkg] = match;
        if (isExemptPackage(`@wordpress/${pkg}`)) {
          continue;
        }
        const external = defaultRequestToExternal(`@wordpress/${pkg}`);
        const handle = defaultRequestToHandle(`@wordpress/${pkg}`);
        if (!external || !handle) continue;
        dependencies.add(handle);
        const replacement = resolveImport(imports, external);
        if (replacement) {
          transformedCode = transformedCode.replace(fullMatch, replacement);
        } else {
          transformedCode = transformedCode.replace(fullMatch, "");
        }
      }
      if (shouldInjectHmr(transformedCode, id, hmrConfig)) {
        transformedCode = `${transformedCode}
${hmrCode}`;
      }
      if (isServe) {
        writeDepsToDisk();
      }
      return {
        code: transformedCode,
        map: null,
        moduleType: "js"
      };
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        name: "editor.deps.json",
        originalFileName: "editor.deps.json",
        source: JSON.stringify([...dependencies], null, 2)
      });
    }
  };
}

// src/theme/index.ts
import fs from "fs";
import path2 from "path";

// src/theme/css-parser.ts
function extractThemeContent(css) {
  const themeMatch = css.match(/@(?:layer\s+)?theme\s*{/s);
  if (!themeMatch) return null;
  const startIndex = themeMatch.index + themeMatch[0].length;
  let braceCount = 1;
  let position = startIndex;
  while (position < css.length) {
    if (css[position] === "\\") {
      position += 2;
      continue;
    }
    if (/['"]/.test(css[position])) {
      const quote = css[position];
      position++;
      while (position < css.length) {
        if (css[position] === "\\") {
          position += 2;
        } else if (css[position] === quote) {
          position++;
          break;
        } else {
          position++;
        }
      }
      continue;
    }
    if (css.slice(position, position + 2) === "/*") {
      position += 2;
      while (position < css.length) {
        if (css.slice(position, position + 2) === "*/") {
          position += 2;
          break;
        }
        position++;
      }
      continue;
    }
    if (css[position] === "{") braceCount++;
    if (css[position] === "}") braceCount--;
    if (braceCount === 0) {
      return css.substring(startIndex, position);
    }
    position++;
  }
  const blockType = themeMatch[0].trim();
  throw new Error(`Unclosed ${blockType} block - missing closing brace`);
}
function extractVariables(regex, content) {
  if (!content) return [];
  const re = new RegExp(regex.source, regex.flags);
  const variables = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    const [, name, value] = match;
    if (name && value && !name.includes("*") && !isCssWideKeyword(value.trim())) {
      variables.push([name, value.trim()]);
    }
  }
  return variables;
}

// src/theme/tailwind.ts
import path from "path";
function mergeThemeWithExtend(theme) {
  if (!theme.extend) return theme;
  return {
    ...theme,
    colors: {
      ...theme.colors,
      ...theme.extend.colors
    },
    fontFamily: {
      ...theme.fontFamily,
      ...theme.extend.fontFamily
    },
    fontSize: {
      ...theme.fontSize,
      ...theme.extend.fontSize
    },
    borderRadius: {
      ...theme.borderRadius,
      ...theme.extend.borderRadius
    }
  };
}
async function loadTailwindConfig(configPath) {
  try {
    const absolutePath = path.resolve(configPath);
    const config = await import(absolutePath);
    const resolvedConfig = config.default || config;
    if (resolvedConfig.theme?.extend) {
      resolvedConfig.theme = mergeThemeWithExtend(resolvedConfig.theme);
    }
    return resolvedConfig;
  } catch (error) {
    throw new Error(
      `Failed to load Tailwind config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// src/theme/colors.ts
function flattenColors(colors) {
  const flattened = [];
  for (const [name, value] of Object.entries(colors)) {
    if (typeof value === "string") {
      flattened.push([name, value]);
    } else if (typeof value === "object" && value !== null) {
      for (const [shade, shadeValue] of Object.entries(value)) {
        if (typeof shadeValue === "string") {
          flattened.push([`${name}-${shade}`, shadeValue]);
        }
      }
    }
  }
  return flattened;
}
function formatColorName(name, shadeLabels) {
  const parts = name.split("-");
  const colorName = parts[0];
  const shade = parts.length > 1 ? parts.slice(1).join(" ") : void 0;
  const capitalizedColor = colorName.charAt(0).toUpperCase() + colorName.slice(1);
  if (!shade) return capitalizedColor;
  if (shadeLabels && shade in shadeLabels) {
    return `${shadeLabels[shade]} ${capitalizedColor}`;
  }
  if (Number.isNaN(Number(shade))) {
    const capitalizedShade = shade.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return `${capitalizedColor} (${capitalizedShade})`;
  }
  return `${capitalizedColor} (${shade})`;
}
function resolveColors(themeVariables, tailwindColors, shadeLabels) {
  const entries = [];
  for (const [name, value] of themeVariables) {
    entries.push({
      name: formatColorName(name, shadeLabels),
      slug: name.toLowerCase(),
      color: value
    });
  }
  if (tailwindColors) {
    for (const [name, value] of flattenColors(tailwindColors)) {
      entries.push({
        name: formatColorName(name, shadeLabels),
        slug: name.toLowerCase(),
        color: value
      });
    }
  }
  return entries;
}

// src/theme/fonts.ts
function processFontFamilies(fonts, fontLabels) {
  return Object.entries(fonts).map(([name, value]) => {
    const fontFamily = Array.isArray(value) ? value.join(", ") : value;
    const displayName = fontLabels?.[name] ?? name;
    return {
      name: displayName,
      slug: name.toLowerCase(),
      fontFamily
    };
  });
}
function resolveFonts(variables, tailwindFonts, fontLabels) {
  const entries = [];
  for (const [name, value] of variables) {
    if (INVALID_FONT_PROPS.some((prop) => name.includes(prop))) continue;
    const displayName = fontLabels?.[name] ?? name;
    entries.push({
      name: displayName,
      slug: name.toLowerCase(),
      fontFamily: value.replace(/['"]/g, "")
    });
  }
  if (tailwindFonts) {
    entries.push(...processFontFamilies(tailwindFonts, fontLabels));
  }
  return entries;
}

// src/theme/font-sizes.ts
function processFontSizes(sizes, fontSizeLabels) {
  return Object.entries(sizes).map(([name, value]) => {
    const size = Array.isArray(value) ? value[0] : value;
    const displayName = fontSizeLabels?.[name] ?? name;
    return {
      name: displayName,
      slug: name.toLowerCase(),
      size
    };
  });
}
function sortFontSizes(fontSizes) {
  return [...fontSizes].sort((a, b) => {
    return convertToRem(a.size) - convertToRem(b.size);
  });
}
function resolveFontSizes(variables, tailwindSizes, fontSizeLabels) {
  const entries = [];
  for (const [name, value] of variables) {
    if (INVALID_TEXT_PROPS.some((prop) => name.includes(prop))) continue;
    const displayName = fontSizeLabels?.[name] ?? name;
    entries.push({
      name: displayName,
      slug: name.toLowerCase(),
      size: value
    });
  }
  if (tailwindSizes) {
    entries.push(...processFontSizes(tailwindSizes, fontSizeLabels));
  }
  return entries;
}

// src/theme/border-radius.ts
function isStaticRadiusValue(value) {
  return !/\(/.test(value.trim());
}
function parseRadiusSizeForSort(size) {
  const firstValue = size.trim().split(/\s+/)[0];
  const result = convertToRem(firstValue);
  if (result === 0 && parseFloat(firstValue) !== 0) return null;
  return result;
}
function sortBorderRadiusSizes(sizes) {
  return [...sizes].sort((a, b) => {
    const sizeA = parseRadiusSizeForSort(a.size);
    const sizeB = parseRadiusSizeForSort(b.size);
    if (sizeA === null && sizeB === null) return 0;
    if (sizeA === null) return 1;
    if (sizeB === null) return -1;
    return sizeA - sizeB;
  });
}
function processBorderRadiusSizes(sizes, borderRadiusLabels) {
  return Object.entries(sizes).filter(([, value]) => isStaticRadiusValue(value)).map(([name, value]) => {
    const displayName = borderRadiusLabels?.[name] ?? name;
    return {
      name: displayName,
      slug: name.toLowerCase(),
      size: value
    };
  });
}
function resolveBorderRadii(variables, tailwindRadius, borderRadiusLabels) {
  const entries = [];
  for (const [name, value] of variables) {
    if (!isStaticRadiusValue(value)) continue;
    const displayName = borderRadiusLabels?.[name] ?? name;
    entries.push({
      name: displayName,
      slug: name.toLowerCase(),
      size: value
    });
  }
  if (tailwindRadius) {
    entries.push(
      ...processBorderRadiusSizes(tailwindRadius, borderRadiusLabels)
    );
  }
  return entries;
}

// src/theme/settings.ts
function dedupeBySlug(entries) {
  const seen = /* @__PURE__ */ new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.slug)) return false;
    seen.add(entry.slug);
    return true;
  });
}
function buildSettings(params) {
  const { baseSettings, colors, fonts, fontSizes, borderRadii, disabled } = params;
  const settings = {
    ...baseSettings,
    color: disabled.colors ? baseSettings?.color : {
      ...baseSettings?.color,
      palette: dedupeBySlug([
        ...baseSettings?.color?.palette || [],
        ...colors || []
      ])
    },
    typography: {
      ...baseSettings?.typography,
      defaultFontSizes: baseSettings?.typography?.defaultFontSizes ?? false,
      customFontSize: baseSettings?.typography?.customFontSize ?? false,
      fontFamilies: disabled.fonts ? baseSettings?.typography?.fontFamilies : dedupeBySlug([
        ...baseSettings?.typography?.fontFamilies || [],
        ...fonts || []
      ]),
      fontSizes: disabled.fontSizes ? baseSettings?.typography?.fontSizes : sortFontSizes(
        dedupeBySlug([
          ...baseSettings?.typography?.fontSizes || [],
          ...fontSizes || []
        ])
      )
    }
  };
  if (disabled.borderRadius) {
    if (baseSettings?.border) {
      settings.border = baseSettings.border;
    }
  } else {
    const mergedRadiusSizes = sortBorderRadiusSizes(
      dedupeBySlug([
        ...baseSettings?.border?.radiusSizes || [],
        ...borderRadii || []
      ])
    );
    if (mergedRadiusSizes.length === 0) {
      if (baseSettings?.border) {
        settings.border = baseSettings.border;
      }
    } else {
      settings.border = {
        ...baseSettings?.border,
        radius: baseSettings?.border?.radius ?? true,
        radiusSizes: mergedRadiusSizes
      };
    }
  }
  return settings;
}

// src/theme/index.ts
function wordpressThemeJson(config = {}) {
  const {
    tailwindConfig,
    disableTailwindColors = true,
    disableTailwindFonts = true,
    disableTailwindFontSizes = true,
    disableTailwindBorderRadius = true,
    baseThemeJsonPath = "./theme.json",
    outputPath = "theme.json",
    cssFile = "main.scss",
    shadeLabels,
    fontLabels,
    fontSizeLabels,
    borderRadiusLabels
  } = config;
  let cssContent = null;
  let resolvedTailwindConfig;
  if (tailwindConfig !== void 0 && typeof tailwindConfig !== "string") {
    throw new Error("tailwindConfig must be a string path or undefined");
  }
  return {
    name: "wordpress-theme-json",
    enforce: "pre",
    async configResolved() {
      if (tailwindConfig) {
        resolvedTailwindConfig = await loadTailwindConfig(tailwindConfig);
      }
    },
    transform(code, id) {
      if (id.includes(cssFile)) {
        cssContent = code;
      }
      return null;
    },
    async generateBundle() {
      try {
        const baseThemeJson = JSON.parse(
          fs.readFileSync(path2.resolve(baseThemeJsonPath), "utf8")
        );
        const themeContent = cssContent ? extractThemeContent(cssContent) : null;
        const theme = resolvedTailwindConfig?.theme;
        const colorVars = extractVariables(
          CSS_VARIABLE_PATTERNS.COLOR,
          themeContent
        );
        const fontVars = extractVariables(
          CSS_VARIABLE_PATTERNS.FONT_FAMILY,
          themeContent
        );
        const fontSizeVars = extractVariables(
          CSS_VARIABLE_PATTERNS.FONT_SIZE,
          themeContent
        );
        const borderRadiusVars = extractVariables(
          CSS_VARIABLE_PATTERNS.BORDER_RADIUS,
          themeContent
        );
        const colors = !disableTailwindColors ? resolveColors(colorVars, theme?.colors, shadeLabels) : void 0;
        const fonts = !disableTailwindFonts ? resolveFonts(fontVars, theme?.fontFamily, fontLabels) : void 0;
        const fontSizes = !disableTailwindFontSizes ? resolveFontSizes(
          fontSizeVars,
          theme?.fontSize,
          fontSizeLabels
        ) : void 0;
        const borderRadii = !disableTailwindBorderRadius ? resolveBorderRadii(
          borderRadiusVars,
          theme?.borderRadius,
          borderRadiusLabels
        ) : void 0;
        const themeJson = {
          __processed__: "This file was generated using Vite",
          ...baseThemeJson,
          settings: buildSettings({
            baseSettings: baseThemeJson.settings,
            colors,
            fonts,
            fontSizes,
            borderRadii,
            disabled: {
              colors: disableTailwindColors,
              fonts: disableTailwindFonts,
              fontSizes: disableTailwindFontSizes,
              borderRadius: disableTailwindBorderRadius
            }
          })
        };
        delete themeJson.__preprocessed__;
        this.emitFile({
          type: "asset",
          fileName: outputPath,
          source: JSON.stringify(themeJson, null, 2)
        });
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    }
  };
}
export {
  wordpressPlugin,
  wordpressThemeJson
};
