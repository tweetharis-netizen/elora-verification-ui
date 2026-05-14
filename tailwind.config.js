/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        elora: {
          100: 'var(--elora-primary)',
          200: 'var(--elora-secondary)',
          300: 'var(--elora-deep)',
          400: 'var(--elora-darkest)',
        },
        'accent-orange': '#E89B71',
        'accent-green': '#7BB099',
        'accent-yellow': '#8FA6CC',
        'accent-pink': '#D98A94',
      },
      fontFamily: {
        sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
        serif: '"Playfair Display", ui-serif, Georgia, serif',
      },
      backgroundColor: {
        'elora-bg': 'var(--elora-bg)',
        'elora-surface': 'var(--elora-surface-main)',
        'elora-surface-alt': 'var(--elora-surface-alt)',
      },
      textColor: {
        'elora-primary': 'var(--elora-text-strong)',
        'elora-secondary': 'var(--elora-text-muted)',
      },
      borderColor: {
        'elora-border': 'var(--elora-border-subtle)',
      },
    },
  },
};
