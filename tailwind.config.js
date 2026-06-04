/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10b981', // Green for organic farm
        secondary: '#f59e0b', // Orange/gold
      },
    },
  },
  plugins: [],
};
