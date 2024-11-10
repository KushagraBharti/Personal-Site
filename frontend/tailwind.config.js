/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5291ff', // Dodger Blue for accent colors
        secondary: '#5291ff',
        links: '#5291ff',
        background: '#f0f4f8', // Light Gray for backgrounds
      },
      fontFamily: {
        'ibm-plex-mono': ['IBM Plex Mono', 'monospace'], // IBM Plex Mono for monospace
        'quattrocento-sans': ['Quattrocento Sans', 'sans-serif'], // Quattrocento Sans as primary sans-serif
        'quattrocento': ['Quattrocento', 'serif'], // Quattrocento for serif
      },
    },
  },
  plugins: [],
};
