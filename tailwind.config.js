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
    "./stores/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: withOpacity("--bg"),
        fg: withOpacity("--fg"),
        muted: withOpacity("--muted"),
        border: withOpacity("--border"),
        healthy: withOpacity("--healthy"),
        warning: withOpacity("--warning"),
        critical: withOpacity("--critical"),
      },
    },
  },
};

export default config;
