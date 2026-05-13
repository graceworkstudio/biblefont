/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['calc(0.875rem * var(--ui-font-zoom, 1))', { lineHeight: '1.25rem' }],
        'sm': ['calc(1rem * var(--ui-font-zoom, 1))', { lineHeight: '1.5rem' }],
        'base': ['calc(1.125rem * var(--ui-font-zoom, 1))', { lineHeight: '1.75rem' }],
        'lg': ['calc(1.25rem * var(--ui-font-zoom, 1))', { lineHeight: '1.75rem' }],
        'xl': ['calc(1.5rem * var(--ui-font-zoom, 1))', { lineHeight: '2rem' }],
        '2xl': ['calc(1.875rem * var(--ui-font-zoom, 1))', { lineHeight: '2.25rem' }],
        '3xl': ['calc(2.25rem * var(--ui-font-zoom, 1))', { lineHeight: '2.5rem' }],
        '4xl': ['calc(3rem * var(--ui-font-zoom, 1))', { lineHeight: '1' }],
        '5xl': ['calc(3.75rem * var(--ui-font-zoom, 1))', { lineHeight: '1' }],
      }
    },
  },
  plugins: [],
}
