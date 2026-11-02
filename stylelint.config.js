const tokenOnly = {
  ignoreValues: ["transparent", "currentColor", "inherit", "initial", "unset", "none", "auto", "0"],
  disableFix: true,
};

const config = {
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    "color-no-hex": true,
    "function-disallowed-list": [
      "rgb",
      "rgba",
      "hsl",
      "hsla",
      "hwb",
      "lab",
      "lch",
      "oklab",
      "oklch",
      "color",
      "color-mix",
    ],
    "scale-unlimited/declaration-strict-value": [
      [
        "/color$/",
        "background",
        "fill",
        "stroke",
        "/^(margin|padding)/",
        "gap",
        "row-gap",
        "column-gap",
        "/radius$/",
        "font-family",
        "font-size",
        "line-height",
        "z-index",
        "transition-duration",
        "transition-timing-function",
        "animation-duration",
        "animation-timing-function",
      ],
      tokenOnly,
    ],
    "unit-disallowed-list": [
      ["px"],
      {
        ignoreProperties: {
          px: [
            "/^border/",
            "/^outline/",
            "/shadow$/",
            "/^(backdrop-)?filter$/",
            "/^(translate|transform)$/",
            "/^scroll-margin/",
            "stroke-width",
            "letter-spacing",
          ],
        },
      },
    ],
  },
  overrides: [
    {
      files: ["src/styles/tokens.css"],
      rules: {
        "color-no-hex": null,
        "function-disallowed-list": null,
        "scale-unlimited/declaration-strict-value": null,
        "unit-disallowed-list": null,
      },
    },
  ],
};

export default config;
