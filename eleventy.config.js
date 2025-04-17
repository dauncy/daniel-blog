const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const Prism            = require("prismjs");
const loadLanguages    = require("prismjs/components/index.js");

// 1) Make sure TS + TSX are registered (with their deps)
loadLanguages(["typescript", "tsx"]);

module.exports = function(eleventyConfig) {
  eleventyConfig.addWatchTarget("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");


  eleventyConfig.addPlugin(syntaxHighlight, {
    lineSeparator: "\n",
    preAttributes: { tabindex: 0 },
    init: ({ Prism }) => {
      // 1) Mark function-declaration names as `.token.function`
      Prism.languages.insertBefore("tsx", "keyword", {
        "function-definition": {
          // capture the name after `function `
          pattern: /(\bfunction\s+)[A-Za-z_$][\w$]*(?=\s*\()/,
          lookbehind: true,
          alias: "function"
        }
      });

      // 2) Highlight parameters in functions / destructuring
      Prism.languages.insertBefore("tsx", "function", {
        parameter: {
          pattern: /[A-Za-z_$][\w$]*(?=\s*[:=,\)\}])/,
          greedy: false
        }
      });

      // 3) PascalCase → .token.type
      Prism.languages.insertBefore("tsx", "keyword", {
        type: {
          pattern: /\b[A-Z][a-zA-Z0-9_]*\b/,
          alias: "type"
        }
      });

      // 4) Vars or type‑literal props (with optional `?`)
      Prism.languages.insertBefore("tsx", "keyword", {
        variable: {
          pattern: /[A-Za-z_$][\w$]*(?=\s*[:=]|\s*\?)/,
          greedy: true
        }
      });

    }
  });


  // …your existing collections & filters…
  eleventyConfig.addCollection("posts", (c) => c.getFilteredByTag("posts"));
  eleventyConfig.addFilter("date", (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year:   "numeric",
      month:  "long",
      day:    "numeric",
    })
  );
  eleventyConfig.addFilter("stripHtml", (v) => v.replace(/<[^>]*>/g, ""));

  return {
    dir: {
      input:    "src",
      includes: "_includes",
      output:   "dist",
    },
    templateFormats:     ["md","njk","html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine:     "njk",
    dataTemplateEngine:     "njk",
  };
};
