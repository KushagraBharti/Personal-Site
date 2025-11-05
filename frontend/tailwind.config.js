/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "hsl(var(--accent) / <alpha-value>)",
        "accent-foreground": "hsl(var(--accent-foreground) / <alpha-value>)",
        bg: "hsl(var(--bg) / <alpha-value>)",
        fg: "hsl(var(--fg) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {
        ambient: "0 1px 2px rgba(15, 23, 42, 0.06)",
        elevated: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
