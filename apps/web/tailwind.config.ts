import type { Config } from 'tailwindcss';

// Design tokens from the architecture doc: deep teal accent, neutral slate scale,
// Inter for UI text with Hind Siliguri available for Bangla content.
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0F766E',
          light: '#14B8A6',
          dark: '#0B5B54',
        },
        answered: '#16A34A',
        unanswered: '#DC2626',
        marked: '#D97706',
        unvisited: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        bangla: ['"Hind Siliguri"', 'ui-sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
