@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  height: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji",
    "Segoe UI Emoji";
}

/* Soft premium background (light) */
body {
  background:
    radial-gradient(900px 420px at 12% 12%, rgba(99, 102, 241, 0.18), transparent 60%),
    radial-gradient(820px 420px at 88% 18%, rgba(56, 189, 248, 0.14), transparent 55%),
    radial-gradient(700px 380px at 70% 88%, rgba(167, 139, 250, 0.14), transparent 60%),
    #f8fafc;
  color: #0f172a;
}

/* Premium background (dark) */
.dark body {
  background:
    radial-gradient(900px 420px at 12% 12%, rgba(99, 102, 241, 0.20), transparent 60%),
    radial-gradient(820px 420px at 88% 18%, rgba(56, 189, 248, 0.12), transparent 55%),
    radial-gradient(700px 380px at 70% 88%, rgba(167, 139, 250, 0.12), transparent 60%),
    #020617;
  color: #e5e7eb;
}

/* Don’t animate the entire DOM — it causes “weird” dark mode */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Nice selection */
::selection {
  background: rgba(99, 102, 241, 0.25);
}

/* Scrollbar (subtle) */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.45);
  border-radius: 999px;
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.25);
}
