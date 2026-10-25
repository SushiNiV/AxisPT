/**
 * Axis design system — Tailwind config (Tailwind v3.4, Create React App 5).
 *
 * Colors are SEMANTIC and point at CSS variables defined in
 * src/GlobalStyle/Tailwind.css, so light/dark switching needs no `dark:` variants.
 * Preflight is OFF during the migration so legacy pages are unaffected; the
 * new components opt into a scoped reset through the `.ax` wrapper class.
 */
const rgb = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class', // matches the existing `.dark` class on <body>
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        canvas: rgb('canvas'),
        surface: { DEFAULT: rgb('surface'), 2: rgb('surface-2') },
        line: { DEFAULT: rgb('line'), strong: rgb('line-strong') },
        ink: { DEFAULT: rgb('ink'), 2: rgb('ink-2'), 3: rgb('ink-3') },
        brand: {
          DEFAULT: rgb('brand'),
          hover: rgb('brand-hover'),
          soft: rgb('brand-soft'),
          ink: rgb('brand-ink'),
          on: rgb('brand-on'),
        },
        ok: { DEFAULT: rgb('ok'), soft: rgb('ok-soft') },
        warn: { DEFAULT: rgb('warn'), soft: rgb('warn-soft') },
        danger: { DEFAULT: rgb('danger'), soft: rgb('danger-soft') },
        // Fixed brand scale for things that must stay maroon in both modes (photo overlays, charts).
        maroon: {
          50: '#fbf1f2', 100: '#f5dfe1', 200: '#ebbfc4', 300: '#dc939b', 400: '#c8606c',
          500: '#a93546', 600: '#8a2336', 700: '#6e1a2b', 800: '#531420', 900: '#3d1616', 950: '#260c0c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      // Radius follows hierarchy: controls < panels < sheets/modals.
      borderRadius: { ctl: '0.625rem', panel: '1rem', sheet: '1.5rem' },
      boxShadow: {
        lift: '0 1px 2px rgb(var(--shadow) / 0.08), 0 10px 24px -14px rgb(var(--shadow) / 0.35)',
      },
    },
  },
  plugins: [],
};