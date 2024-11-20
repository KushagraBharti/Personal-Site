/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary and secondary accent colors
        primary: "#3B82F6", // Blue
        "primary-dark": "#2563EB", // Darker Blue
        secondary: "#F43F5E", // Pink-Red
        "secondary-dark": "#E11D48", // Darker Pink-Red
        tertiary: "#10B981", // Green

        // Neutral grays
        gray: {
          50: "#F9FAFB", // Almost White
          100: "#F3F4F6", // Light Gray
          200: "#E5E7EB", // Lighter Gray
          300: "#D1D5DB", // Soft Gray
          400: "#9CA3AF", // Medium Gray
          500: "#6B7280", // Neutral Gray
          600: "#4B5563", // Dark Gray
          700: "#374151", // Deeper Gray
          800: "#1F2937", // Almost Black
          900: "#111827", // Black-like Gray
        },

        // Complementary accents
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        // Pastel accents
        pastel: {
          pink: "#F9A8D4",
          purple: "#C084FC",
          green: "#86EFAC",
          blue: "#93C5FD",
          yellow: "#FDE68A",
        },

        // Other useful colors
        warning: "#F59E0B", // Amber
        success: "#10B981", // Green
        danger: "#EF4444", // Red
        info: "#3B82F6", // Blue
      },

      // Typography
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Modern and clean
        playfair: ['Playfair Display', 'serif'], // Elegant
        roboto: ['Roboto', 'sans-serif'], // Minimalist sans-serif
        montserrat: ['Montserrat', 'sans-serif'], // Clean geometric sans-serif
      },
    },
  },
  plugins: [],
};
