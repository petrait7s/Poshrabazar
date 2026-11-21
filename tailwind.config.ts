import type { Config } from "tailwindcss";

// PosraBazar design tokens — Deep Orange system. See docs/DESIGN_SYSTEM.md for usage and contrast rules.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#C2410C", 50: "#FFF7ED", 100: "#FFEDD5", 700: "#9A3412", 800: "#7C2D12" }, // buttons (white text 5.18:1), links
        secondary: { DEFAULT: "#EA580C" },                                                                // hover/large accents only (white text 3.56:1)
        accent: { DEFAULT: "#F59E0B", 50: "#FFFBEB", 700: "#B45309" },                                     // badges, ratings; use ink text on it; accent-700 for text on light
        cream: "#FFFBF5",                                                                                  // page background
        surface: "#FFFFFF",
        ink: { DEFAULT: "#292524", 700: "#44403C", 800: "#1C1917", 900: "#0C0A09" },                       // primary text, dark panels
        muted: "#78716C",                                                                                  // secondary text (4.65:1 on cream)
        line: "#E7E0D8",                                                                                   // borders and dividers
        tint: "#F5EFE6",                                                                                   // subtle fills, hover, skeleton
      },
      fontFamily: {
        // Inter covers Latin and digits, Noto Sans Bengali covers Bengali glyphs; the browser picks per character.
        sans: ["var(--font-inter)", "var(--font-bangla)", "system-ui", "sans-serif"],
        bn: ["var(--font-inter)", "var(--font-bangla)", "system-ui", "sans-serif"],
      },
      borderRadius: { DEFAULT: "4px", md: "6px", lg: "8px" },
      boxShadow: {
        card: "0 1px 2px rgba(41,37,36,.06), 0 2px 8px -2px rgba(41,37,36,.08)",
        lift: "0 2px 4px rgba(41,37,36,.06), 0 12px 28px -8px rgba(41,37,36,.18)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { rise: "rise .35s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
