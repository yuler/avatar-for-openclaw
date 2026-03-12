/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,svelte}'],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#22d3ee',
          500: '#06b6d4'
        }
      }
    }
  },
  plugins: []
};
