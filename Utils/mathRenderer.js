const katex = require("katex");

const esc = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/&lt;(\/?)(b|i|u|em|strong|sub|sup)&gt;/gi, (_, slash, tag) => `<${slash}${tag.toLowerCase()}>`)
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>");
};

const MATH_PATTERN = /\$\$([\s\S]+?)\$\$|\$(?!\s)([^$\n]*?[^\s$])\$(?!\d)/g;

const renderText = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  let html = "";
  let last = 0;
  for (const match of text.matchAll(MATH_PATTERN)) {
    html += esc(text.slice(last, match.index));
    html += katex.renderToString(match[1] ?? match[2], {
      displayMode: match[1] !== undefined,
      output: "html",
      throwOnError: false,
    });
    last = match.index + match[0].length;
  }
  return html + esc(text.slice(last));
};

module.exports = { esc, renderText };