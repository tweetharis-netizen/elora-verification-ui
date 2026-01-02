// lib/formatting.js
// Lightweight text formatting helpers for readability in the UI.
// We avoid heavy markdown renderers to keep bundle size small.

// Convert a subset of common LaTeX-ish sequences into plain, readable text.
// This is NOT a full LaTeX parser — it targets the most common confusing bits.
export function stripLatexToPlain(input) {
  let text = String(input || "");

  // Remove math delimiters
  text = text
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    .replace(/\\\(|\\\)/g, "")
    .replace(/\\\[|\\\]/g, "");

  // Fractions: \frac{a}{b} -> a/b
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_, a, b) => `${a}/${b}`);

  // Multiplication/division symbols
  text = text
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "·");

  // Exponents: x^{2} -> x^2 (keep simple)
  text = text.replace(/\^\{([^}]+)\}/g, "^$1");

  // Remove remaining commands
  text = text.replace(/\\(text|left|right|quad|qquad)\b/g, "");
  text = text.replace(/\\[a-zA-Z]+/g, "");

  // Clean braces
  text = text.replace(/[{}]/g, "");

  // Collapse spaces
  text = text.replace(/[ \t]{2,}/g, " ");

  return text.trim();
}

export function toParagraphs(input) {
  const text = stripLatexToPlain(input);
  const lines = text.split(/\r?\n/);

  const blocks = [];
  let buf = [];

  const flush = () => {
    const t = buf.join(" ").trim();
    if (t) blocks.push(t);
    buf = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    buf.push(trimmed);
  }
  flush();
  return blocks;
}
