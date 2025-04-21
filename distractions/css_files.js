const cssEffects = {
  gray_filter: `
    body, img, video {
      -webkit-filter: grayscale(100%);
      filter: grayscale(100%);
    }
  `,
  light_blur: `
    body, img, video {
      -webkit-filter: blur(0.5px);
      filter: blur(0.5px);
    }
  `,
  heavy_blur: `
    body, img, video {
      -webkit-filter: blur(1px);
      filter: blur(1px);
    }
  `,
  rotate: `
    html {
      transform: rotate(3deg) !important;
    }
  `,
  saturation: `
    body, img, video {
      -webkit-filter: hue-rotate(90deg) saturate(150%) brightness(1.1);
      filter: hue-rotate(90deg) saturate(150%) brightness(1.1);
    }
  `,
  wobble: `
    * {
      animation: wobble 5s infinite ease-in-out alternate;
    }

    @keyframes wobble {
      0%   { transform: rotate(0.5deg); }
      100% { transform: rotate(-0.5deg); }
    }
  `,
  invert_colors: `
    html {
      filter: invert(100%);
    }
  `,
  breathe: `
    html {
      animation: breathe 2s ease-in-out infinite;
    }

    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `,
  vibrate: `
    * {
      animation: vibrate 0.1s infinite;
    }

    @keyframes vibrate {
      0% { transform: translate(0); }
      25% { transform: translate(1px, -1px); }
      50% { transform: translate(-1px, 1px); }
      75% { transform: translate(1px, 1px); }
      100% { transform: translate(-1px, -1px); }
    }
  `,
  letter_jump: `
    p, h1, h2, h3, h4, h5, h6, span, a {
      display: inline-block;
      animation: jumpyText 0.6s infinite;
    }

    @keyframes jumpyText {
      0% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
      100% { transform: translateY(0); }
    }
  `,
  color_shift: `
    html {
      animation: colorShift 5s infinite linear;
    }

    @keyframes colorShift {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }
  `,
};

function simpleVisualCSSMerger(cssList) {
  const filters = [];
  const transforms = [];
  const otherCSS = [];

  cssList.forEach((css) => {
    // Extract and preserve keyframes
    const keyframes = css.match(/@keyframes[\s\S]*?\{[\s\S]*?\}\s*\}/g) || [];
    keyframes.forEach((kf) => otherCSS.push(kf));

    // Remove keyframes temporarily to avoid corrupting them
    const cssWithoutKeyframes = css.replace(
      /@keyframes[\s\S]*?\{[\s\S]*?\}\s*\}/g,
      ""
    );

    // Match filters
    const filterMatches = cssWithoutKeyframes.match(/filter\s*:\s*([^;]+);/g);
    if (filterMatches) {
      filterMatches.forEach((match) => {
        const val = match.match(/filter\s*:\s*([^;]+);/);
        if (val) filters.push(val[1].trim());
      });
    }

    // Match transforms (only from selectors)
    const transformMatches = cssWithoutKeyframes.match(
      /transform\s*:\s*([^;]+);/g
    );
    if (transformMatches) {
      transformMatches.forEach((match) => {
        const val = match.match(/transform\s*:\s*([^;]+);/);
        if (val) transforms.push(val[1].trim());
      });
    }

    // Clean up the rest (excluding transform and filter declarations)
    const cleaned = cssWithoutKeyframes
      .replace(/filter\s*:\s*[^;]+;/g, "")
      .replace(/transform\s*:\s*[^;]+;/g, "")
      .trim();

    if (cleaned) otherCSS.push(cleaned);
  });

  const mergedCSS = [];

  if (filters.length > 0) {
    mergedCSS.push(`
body, img, video {
  -webkit-filter: ${filters.join(" ")};
  filter: ${filters.join(" ")};
}
`);
  }

  if (transforms.length > 0) {
    mergedCSS.push(`
html {
  transform: ${transforms.join(" ")};
}
`);
  }

  mergedCSS.push(...otherCSS);

  return mergedCSS.join("\n\n");
}
