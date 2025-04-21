const cssEffects = {
  gray_filter: `
      body, img, video {
        -webkit-filter: grayscale(100%);
        filter: grayscale(100%);
      }
    `,
  light_blur: `
    body, img, video {
      -webkit-filter: blur(1px);
      filter: blur(1px);
    }
  `,
  heavy_blur: `
      body, img, video {
        -webkit-filter: blur(2px);
        filter: blur(2px);
      }
    `,
  rotate: `
      html {
        transform: rotate(90deg) !important;
      }
    `,
};

function simpleVisualCSSMerger(cssList) {
  const filters = [];
  const transforms = [];
  const otherCSS = [];

  cssList.forEach((css) => {
    // Match filter
    const filterMatches = css.match(/filter\s*:\s*([^;]+);/g);
    if (filterMatches) {
      filterMatches.forEach((match) => {
        const val = match.match(/filter\s*:\s*([^;]+);/);
        if (val) filters.push(val[1].trim());
      });
    }

    // Match transform
    const transformMatches = css.match(/transform\s*:\s*([^;]+);/g);
    if (transformMatches) {
      transformMatches.forEach((match) => {
        const val = match.match(/transform\s*:\s*([^;]+);/);
        if (val) transforms.push(val[1].trim());
      });
    }

    // Keep all non-filter/transform stuff
    const cleaned = css
      .replace(/filter\s*:\s*[^;]+;/g, "")
      .replace(/transform\s*:\s*[^;]+;/g, "")
      .trim();

    if (cleaned) otherCSS.push(cleaned);
  });

  const mergedCSS = [];

  // Merge filter
  if (filters.length > 0) {
    mergedCSS.push(`
  body, img, video {
    -webkit-filter: ${filters.join(" ")};
    filter: ${filters.join(" ")};
  }
  `);
  }

  // Merge transform
  if (transforms.length > 0) {
    mergedCSS.push(`
  html {
    transform: ${transforms.join(" ")};
  }
  `);
  }

  // Add everything else
  mergedCSS.push(...otherCSS);

  return mergedCSS.join("\n\n");
}
