import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#142B45", 700: "#1d3a5c", 800: "#0f2236", 900: "#0a1727" },
        teal: { DEFAULT: "#167C78", 50: "#e8f3f2", 100: "#cde5e3", 600: "#116662", 700: "#0d514e" },
        paper: "#F8F7F2",
        ink: "#252A30",
        mist: { DEFAULT: "#E9EDF0", 300: "#d5dbe0", 500: "#8a96a2" },
        gold: { DEFAULT: "#C6A15B", 50: "#f7f1e3", 700: "#8f7131" },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "var(--font-bangla)", "system-ui", "sans-serif"],
        bn: ["var(--font-bangla)", "var(--font-montserrat)", "serif"],
      },
      borderRadius: { DEFAULT: "4px", md: "6px", lg: "8px" },
      boxShadow: {
        card: "0 1px 2px rgba(20,43,69,.06), 0 4px 12px -4px rgba(20,43,69,.08)",
        lift: "0 2px 4px rgba(20,43,69,.06), 0 12px 28px -8px rgba(20,43,69,.18)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { rise: "rise .45s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
