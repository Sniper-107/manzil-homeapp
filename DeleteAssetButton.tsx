@import "tailwindcss";

/*
  Manzil design tokens — a "household ledger" identity: warm parchment
  paper, deep ledger-book teal ink, tabular figures for money/dates.
  System font stacks only (no external font fetch — one less network
  dependency, faster on mobile data).
*/
@theme {
  --color-stone: #f6f3ec;
  --color-stone-dim: #efeade;
  --color-ink: #24312c;
  --color-ink-soft: #56645d;
  --color-teal: #2f5d50;
  --color-teal-dark: #21443a;
  --color-teal-tint: #dce8e2;
  --color-amber: #c08a2e;
  --color-amber-tint: #f3e6cb;
  --color-rust: #a6402f;
  --color-rust-tint: #f1ddd7;
  --color-line: #e4decf;

  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --font-serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;
}

body {
  background-color: var(--color-stone);
  color: var(--color-ink);
}
