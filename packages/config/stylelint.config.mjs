// working-agreements §1 and §8, design-technical §1.9.
// Components consume only var(--token); literals are allowed only where §8 says so.

// Properties whose value can only be colour literals or colour functions.
const colorProps =
  '/^(color|background(-color|-image)?|border-(top|right|bottom|left)?-?color|outline-color|fill|stroke|caret-color|text-decoration-color|box-shadow|text-shadow)$/';

// Properties that must be a token (or a keyword), never a raw number or name.
const tokenOnlyProps =
  '/^(font|font-family|font-size|font-weight|line-height|letter-spacing|border-radius|border-(top|bottom)-(left|right)-radius)$/';

// Properties where a length / time literal means a missing token.
const scaleProps =
  '/^(gap|row-gap|column-gap|padding(-.+)?|margin(-.+)?|transition(-.+)?|animation(-.+)?)$/';

// Easing must come from --ease-* tokens, never a keyword or a curve written inline.
const motionProps = '/^(transition(-.+)?|animation(-.+)?)$/';
const easingLiteral =
  '/(?<![\\w-])(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)(?![\\w-])|cubic-bezier\\(|steps\\(|linear\\(/';

const colorLiteral = '/(#[0-9a-f]{3,8}\\b|\\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\()/i';
const lengthOrTimeLiteral =
  '/(?<![\\w-])[+-]?\\d*\\.?\\d+(rem|em|ch|vw|vh|svh|lvh|dvh|vmin|vmax|ms|s)\\b/';
// anything that is not a token, calc(), min/max/clamp() or a CSS-wide / structural keyword
const notATokenOrKeyword =
  '/^(?!(var\\(|calc\\(|clamp\\(|min\\(|max\\(|inherit$|initial$|unset$|revert$|normal$|none$|0$))/';

// px is only allowed in hairlines, strokes, shadows, blurs and motion offsets (§8).
const pxAllowedIn = [
  '/^(-webkit-)?(box-shadow|text-shadow|filter|backdrop-filter)$/',
  '/^outline(-.+)?$/',
  '/^border(-.+)?-width$/',
  '/^stroke-width$/',
  '/^(translate|transform|scale|rotate|offset(-.+)?)$/',
];

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    '**/node_modules/**',
    '**/.next/**',
    '**/.open-next/**',
    '**/dist/**',
    '**/styles/tokens.css',
    '**/fixtures/**',
  ],
  rules: {
    'declaration-property-value-disallowed-list': [
      {
        [colorProps]: [colorLiteral],
        // a literal hidden inside calc()/clamp()/min()/max() is still a literal
        [tokenOnlyProps]: [notATokenOrKeyword, lengthOrTimeLiteral],
        [scaleProps]: [lengthOrTimeLiteral],
        [motionProps]: [easingLiteral],
      },
    ],
    'color-named': 'never',
    'unit-disallowed-list': [['px'], { ignoreProperties: { px: pxAllowedIn } }],
    'declaration-no-important': true,
    'selector-max-compound-selectors': 2,
    'property-disallowed-list': [
      [
        'border',
        'border-color',
        'border-style',
        '/^border-(top|right|bottom|left)$/',
        '/^border-(top|right|bottom|left)-(color|style)$/',
      ],
    ],
    'declaration-block-single-line-max-declarations': null,
    // CSS Modules: class names are camelCase or BEM-ish, not forced to kebab-case.
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    // tokens come from generated tokens.css, so keyframes names etc. stay free
    'keyframes-name-pattern': null,
  },
};
