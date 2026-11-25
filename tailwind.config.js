/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#FAF8F5',
        cardwarm: '#F2ECE4',
        ink: '#4A3525',
        earth: '#7A583E',
        terracotta: '#C77B5A',
        sage: '#A5B49A',
        sun: '#E8C878',
      },
      fontFamily: {
        display: ['"Fredoka"', '"Noto Sans Bengali"', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['"Nunito"', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        storybook: '0 10px 30px -10px rgba(74, 53, 37, 0.14)',
        tactile: '0 4px 0 0 rgba(74, 53, 37, 0.14)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
