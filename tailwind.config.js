/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#FAF8F5',
        sandcard: '#F2ECE4',
        espresso: '#4A3525',
        cocoa: '#7A583E',
        terracotta: '#C77B5A',
        sage: '#A5B49A',
        sunbeam: '#E8C878',
      },
      fontFamily: {
        display: ['"Trebuchet MS"', '"Segoe UI"', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        storybook: '0 8px 24px -6px rgba(74, 53, 37, 0.12), 0 2px 6px -1px rgba(74, 53, 37, 0.06)',
        tactile: '0 4px 0 0 rgba(74, 53, 37, 0.16)',
        'tactile-terracotta': '0 4px 0 0 #9F5A3D',
        'tactile-sage': '0 4px 0 0 #7E8E73',
        'tactile-sunbeam': '0 4px 0 0 #C4A24F',
      },
      borderRadius: {
        storybook: '1.5rem',
      },
    },
  },
  plugins: [],
};
