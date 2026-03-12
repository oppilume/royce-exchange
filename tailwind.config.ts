import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        night: "#0d1526",
        line: "#243249",
        cream: "#f6f4ed",
        gold: "#ffcf57",
        sky: "#8ec5ff",
        mint: "#9af7c4",
        danger: "#ff7c87"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px rgba(4,11,24,0.45)"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, rgba(255,207,87,0.18), transparent 30%), radial-gradient(circle at top right, rgba(142,197,255,0.16), transparent 28%), linear-gradient(180deg, #12203a 0%, #0b1221 52%, #09111f 100%)"
      },
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"]
      }
    }
  },
  plugins: []
};

export default config;
