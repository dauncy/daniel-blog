const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const loadLanguages = require("prismjs/components/");
loadLanguages(["typescript", "tsx"]);
const Prism = require("prismjs");

// --- Rule for Function Names (after 'function' keyword) ---
const functionNameRule = {
    // Use positive lookbehind (?<=...) to ensure 'function ' precedes the identifier
    // Matches the identifier itself: [A-Za-z_$] starts, [\w$]* continues
    pattern: /(?<=function\s+)[A-Za-z_$][\w$]*/,
    alias: 'function-name' // Specific alias for function declarations
};

// --- Rule for Constant Names (after 'const' keyword) ---
const constantNameRule = {
    // Use positive lookbehind (?<=...) to ensure 'const ' precedes the identifier
    // Only match if the first character is uppercase
    pattern: /(?<=const\s+)[A-Z][A-Za-z0-9_$]*/,
    alias: 'constant-name' // Specific alias for const declarations
                           // You could use 'function-name' alias too if you want identical styling target
};

// --- Rule for Capitalized Type Usages (keep this) ---
const typeUsageRule = {
  pattern: /\b[A-Z][A-Za-z0-9_]*\b/,
  alias: 'class-name'
};


// --- Rule for HTML-like tags in JSX/TSX ---
const htmlTagRule = {
  // Match div, p, span, etc. when they appear between angle brackets
  // This looks for tag names that follow < or </
  pattern: /(?<=<\/?)(div|p|span|a|ul|li|ol|img|button|input|form|header|footer|main|section|article|nav|h[1-6])\b/,
  alias: 'tag' // Use the 'tag' class for styling
};

// --- Rule for custom component names in JSX/TSX ---
const componentTagRule = {
  // Match capitalized component names between angle brackets
  pattern: /(?<=<\/?)[A-Z][A-Za-z0-9_]*\b/,
  alias: 'tag' // Use the same 'tag' class for styling
};

// --- Inject Rules into TypeScript ---
// Order is important. We want function/constant names identified first.
// Injecting before 'keyword' is often effective for declaration names.
Prism.languages.insertBefore('typescript', 'keyword', {
    'function-name': functionNameRule,
    'constant-name': constantNameRule,
    // The general type usage rule comes after, so 'const MyType = ...' highlights 'MyType' as constant-name
    // but 'let x: MyType' highlights 'MyType' as class-name.
    'type-usage': typeUsageRule,
    
});

// --- Inject Rules into TSX ---
// Maintain the same order and logic relative to TSX specifics like 'tag'.
Prism.languages.insertBefore('tsx', 'tag', {
    'function-name': functionNameRule,
    'constant-name': constantNameRule,
    'type-usage': typeUsageRule,
    'tag': htmlTagRule
});

// // --- Prevent JSX tags from being wrongly marked ---
// // Re-assert 'tag' priority if necessary (helps prevent <Component> being marked as constant-name)
// if (Prism.languages.tsx && Prism.languages.tsx.tag) {
//     Prism.languages.insertBefore('tsx', ['function-name', 'constant-name', 'type-usage'], {
//         'tag': Prism.languages.tsx.tag
//     });
// }


module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight, {
    templateFormats: ["md", "njk", "html"],
  });

  eleventyConfig.addWatchTarget("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");


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
