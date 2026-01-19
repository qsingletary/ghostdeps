/** @type {import('tailwindcss').Config} */
const withOpacity =
  (variable) =>
  ({ opacityValue }) =>
    `rgb(var(${variable}) / ${opacityValue ?? 1})`;

const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./common/**/*.{js,ts,jsx,tsx}",
    "./modules/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./stores/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: withOpacity("--bg-rgb"),
        fg: withOpacity("--fg-rgb"),
        muted: withOpacity("--muted-rgb"),
        border: withOpacity("--border-rgb"),
        accent: withOpacity("--accent-rgb"),
        surface: withOpacity("--surface-rgb"),
        healthy: withOpacity("--healthy-rgb"),
        warning: withOpacity("--warning-rgb"),
        critical: withOpacity("--critical-rgb"),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgb(var(--accent-rgb) / 0.3)',
        'glow-lg': '0 0 40px rgb(var(--accent-rgb) / 0.4)',
      },
    },
  },
};

export default config;
