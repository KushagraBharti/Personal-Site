/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E90FF', // Dodger Blue for accent colors
        secondary: '#343A40', // Dark Gray for main text
        background: '#F8F9FA', // Light Gray for backgrounds
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
