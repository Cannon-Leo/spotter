/**
 * build-tokens.js
 * Converts design-tokens.tokens.json to standard CSS variables.
 *
 * The JSON is the single source of truth for primitives, colour roles, the
 * light/dark mode overrides and elevation, so no theme value is ever
 * hand-maintained in component or global CSS.
 *
 * Usage:
 *   node scripts/build-tokens.js [path/to/tokens.json] [path/to/output.css]
 */

const fs = require('fs');
const path = require('path');

function toKebab(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function convertTokensToCss(inputPath, outputPath) {
  const resolvedInput = path.resolve(inputPath);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`Error: Tokens file not found at ${resolvedInput}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedInput, 'utf8');
  const tokens = JSON.parse(raw);

  const pathToVar = new Map();
  const primitivesKeyLines = [];
  const primitivesPaletteLines = [];
  const colorRoleLines = [];
  const effectLines = [];
  const typographyVarLines = [];
  const typographyUtilityClasses = [];

  // Replaces every {token.path} inside a value, so emitted CSS never contains
  // a raw palette hex outside the primitive layer.
  function resolveAliases(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/\{([^}]+)\}/g, (match, aliasPath) => {
      const key = aliasPath.trim();
      if (pathToVar.has(key)) return `var(${pathToVar.get(key)})`;
      console.warn(`[Warning] Unresolved token reference "${key}"`);
      return match;
    });
  }

  // --------------------------------------------------------------------------
  // 1. Primitive Key Colors
  // --------------------------------------------------------------------------
  if (tokens.primitives && tokens.primitives['key colors']) {
    for (const [keyName, token] of Object.entries(tokens.primitives['key colors'])) {
      const cleanKey = keyName.replace(/\s*key color$/i, '');
      const varName = `--primitive-key-${toKebab(cleanKey)}`;
      pathToVar.set(`primitives.key colors.${keyName}`, varName);
      primitivesKeyLines.push(`  ${varName}: ${token.value};`);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Primitive Color Palettes
  // --------------------------------------------------------------------------
  if (tokens.primitives && tokens.primitives['color palettes']) {
    for (const [paletteName, palette] of Object.entries(tokens.primitives['color palettes'])) {
      for (const [stepName, token] of Object.entries(palette)) {
        const match = stepName.match(/(\d+)$/);
        const stepNum = match ? match[1] : toKebab(stepName);
        const varName = `--primitive-palette-${toKebab(paletteName)}-${stepNum}`;
        pathToVar.set(`primitives.color palettes.${paletteName}.${stepName}`, varName);
        primitivesPaletteLines.push(`  ${varName}: ${token.value};`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3. Color Roles (Semantic Tokens for UI)
  // --------------------------------------------------------------------------
  if (tokens['color roles']) {
    // Pre-register all role variable names to support role-to-role aliases
    for (const roleName of Object.keys(tokens['color roles'])) {
      const varName = `--color-${toKebab(roleName)}`;
      pathToVar.set(`color roles.${roleName}`, varName);
    }

    for (const [roleName, token] of Object.entries(tokens['color roles'])) {
      const varName = pathToVar.get(`color roles.${roleName}`);
      const cssValue = resolveAliases(token.value);
      colorRoleLines.push(`  ${varName}: ${cssValue};`);
    }
  }

  // --------------------------------------------------------------------------
  // 4. Mode Overrides (light / dark) and elevation
  // --------------------------------------------------------------------------
  const modes = tokens.modes || {};

  function modeColorLines(group) {
    const lines = [];
    for (const [roleName, token] of Object.entries(group || {})) {
      lines.push(`  --color-${toKebab(roleName)}: ${resolveAliases(token.value)};`);
    }
    return lines;
  }

  function elevationLines(group) {
    const lines = [];
    for (const [name, token] of Object.entries(group || {})) {
      lines.push(`  --elevation-${toKebab(name)}: ${resolveAliases(token.value)};`);
    }
    return lines;
  }

  // `shared` values hold in both modes and only need to be declared once.
  const sharedColorLines = modeColorLines(modes.shared);
  const lightColorLines = modeColorLines(modes.light);
  const darkColorLines = [...sharedColorLines, ...modeColorLines(modes.dark)];

  const lightElevation = elevationLines(modes.elevation && modes.elevation.light);
  const darkElevation = elevationLines(modes.elevation && modes.elevation.dark);

  const rootModeLines = [...sharedColorLines, ...lightColorLines, ...lightElevation];
  const darkModeLines = [...darkColorLines, ...darkElevation];

  // --------------------------------------------------------------------------
  // 5. Effects (Drop Shadows)
  // --------------------------------------------------------------------------
  if (tokens.effect) {
    for (const [effectName, token] of Object.entries(tokens.effect)) {
      const varName = `--shadow-${toKebab(effectName.replace(/\s*shadow$/i, ''))}`;
      if (token.type === 'custom-shadow' && token.value) {
        const v = token.value;
        const shadowCss = `${v.offsetX || 0}px ${v.offsetY || 0}px ${v.radius || 0}px ${v.spread || 0}px ${v.color}`;
        effectLines.push(`  ${varName}: ${shadowCss};`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. Typography
  // --------------------------------------------------------------------------
  if (tokens.typography) {
    for (const [typeName, typeObj] of Object.entries(tokens.typography)) {
      const baseName = toKebab(typeName);
      const fontSize = typeObj.fontSize ? `${typeObj.fontSize.value}px` : undefined;
      const lineHeight = typeObj.lineHeight ? `${typeObj.lineHeight.value}px` : undefined;
      const fontWeight = typeObj.fontWeight ? typeObj.fontWeight.value : undefined;
      const fontFamily = typeObj.fontFamily
        ? `"${typeObj.fontFamily.value}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        : undefined;
      const letterSpacing = typeObj.letterSpacing ? `${typeObj.letterSpacing.value}px` : undefined;

      if (fontFamily) typographyVarLines.push(`  --typography-${baseName}-font-family: ${fontFamily};`);
      if (fontSize) typographyVarLines.push(`  --typography-${baseName}-font-size: ${fontSize};`);
      if (lineHeight) typographyVarLines.push(`  --typography-${baseName}-line-height: ${lineHeight};`);
      if (fontWeight) typographyVarLines.push(`  --typography-${baseName}-font-weight: ${fontWeight};`);
      if (letterSpacing) typographyVarLines.push(`  --typography-${baseName}-letter-spacing: ${letterSpacing};`);

      typographyUtilityClasses.push(
`.type-${baseName} {
  font-family: var(--typography-${baseName}-font-family);
  font-size: var(--typography-${baseName}-font-size);
  line-height: var(--typography-${baseName}-line-height);
  font-weight: var(--typography-${baseName}-font-weight);
  letter-spacing: var(--typography-${baseName}-letter-spacing);
}`
      );
    }
  }

  // --------------------------------------------------------------------------
  // CSS Document Assembly
  // --------------------------------------------------------------------------
  const cssContent = `/**
 * ==============================================================================
 * Spotter Design System Tokens
 * Generated automatically from design-tokens.tokens.json
 *
 * ARCHITECTURAL GUIDELINES:
 * 1. PRIMITIVES (--primitive-*):
 *    Foundational color palettes and key colors.
 *    DO NOT use primitive variables directly in UI components.
 *
 * 2. COLOR ROLES (--color-*):
 *    Semantic roles (primary, surface, background, error, container, on-*).
 *    ALWAYS use these variables in UI elements, components, and templates.
 *    This guarantees that theming and contrast changes apply without breaking
 *    component styles.
 *
 * 3. MODES:
 *    Light values live on :root. Dark values are emitted on html[data-theme="dark"]
 *    for the explicit toggle and repeated inside the prefers-color-scheme media
 *    query so no-JS visitors still follow the operating system. Both blocks come
 *    from the same JSON source, so they cannot drift apart.
 *
 * 4. ELEVATION & SHADOWS (--shadow-* and --elevation-*):
 *    --shadow-* are the brand glow primitives from the design file.
 *    --elevation-* are the semantic, mode-aware shadows used by components.
 *
 * 5. TYPOGRAPHY (--typography-*, --font-weight-* and .type-*):
 *    Responsive font scale, weight roles and utility classes.
 * ==============================================================================
 */

:root {
  color-scheme: light;

  /* ==========================================================================
   * 1. PRIMITIVE KEY COLORS (Private - Do not use in UI components)
   * ========================================================================== */
${primitivesKeyLines.join('\n')}

  /* ==========================================================================
   * 2. PRIMITIVE COLOR PALETTES (Private - Do not use in UI components)
   * ========================================================================== */
${primitivesPaletteLines.join('\n')}

  /* ==========================================================================
   * 3. COLOR ROLES (Public - USE THESE DIRECTLY IN UI COMPONENTS)
   * ========================================================================== */
${colorRoleLines.join('\n')}

  /* ==========================================================================
   * 4. MODE OVERRIDES (shared + light) AND ELEVATION
   * ========================================================================== */
${rootModeLines.join('\n')}

  /* ==========================================================================
   * 5. BRAND SHADOW PRIMITIVES (from the design file)
   * ========================================================================== */
${effectLines.join('\n')}

  /* ==========================================================================
   * 6. TYPOGRAPHY VARIABLES
   * ========================================================================== */
${typographyVarLines.join('\n')}

  /* ==========================================================================
   * 7. SPACING, RADIUS & MOTION (Standard 4px Scale Extensions)
   * ========================================================================== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-18: 72px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
  --space-40: 160px;

  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --motion-duration-fast: 150ms;
  --motion-duration-normal: 250ms;
  --motion-duration-slow: 600ms;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);

  /* ==========================================================================
   * 8. FONT WEIGHT ROLES (semantic emphasis scale)
   * ========================================================================== */
  --font-weight-regular: 500;
  --font-weight-medium: 600;
  --font-weight-bold: 700;
  --font-weight-extra-bold: 800;
}

/* ==========================================================================
 * 9. DARK MODE
 * Generated from modes.dark. The media query block mirrors the attribute block
 * so a visitor without JavaScript still follows the operating system.
 * ========================================================================== */
html[data-theme="dark"] {
  color-scheme: dark;
${darkModeLines.join('\n')}
}

@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) {
    color-scheme: dark;
${darkModeLines.map((line) => `  ${line}`).join('\n')}
  }
}

/* ==========================================================================
 * 10. TYPOGRAPHY UTILITY CLASSES
 * ========================================================================== */
${typographyUtilityClasses.join('\n\n')}
`;

  if (outputPath) {
    const resolvedOutput = path.resolve(outputPath);
    const outputDir = path.dirname(resolvedOutput);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(resolvedOutput, cssContent, 'utf8');
    console.log(`[Success] Design tokens successfully compiled to CSS: ${resolvedOutput}`);
  }

  return cssContent;
}

// CLI Execution support
if (require.main === module) {
  const args = process.argv.slice(2);
  const defaultInput = path.resolve(__dirname, '../design-tokens.tokens.json');
  const defaultOutput = path.resolve(__dirname, '../styles/tokens.css');

  const input = args[0] ? path.resolve(args[0]) : defaultInput;
  const output = args[1] ? path.resolve(args[1]) : defaultOutput;

  convertTokensToCss(input, output);
}

module.exports = { convertTokensToCss };
