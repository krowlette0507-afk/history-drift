import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Coffee shop warm palette
        coffee: {
          50:  "#fdf8f0",
          100: "#f9edd9",
          200: "#f2d9b0",
          300: "#e8bf7e",
          400: "#dba054",
          500: "#c8843a",
          600: "#a8672a",
          700: "#8a5021",
          800: "#6b3d1e",
          900: "#4e2c16",
          950: "#2c1709",
        },
        gold: {
          300: "#f0d060",
          400: "#e8bb3a",
          500: "#d4a017",
          600: "#b8870e",
          700: "#9a6e0a",
        },
        chalk: {
          50:  "#f5f0e8",
          100: "#e8dfc8",
          200: "#d4c49a",
          300: "#bfa66a",
          400: "#a68840",
          500: "#8a6e28",
          600: "#6e5518",
        },
        // Dark board background
        board: {
          900: "#1a1208",
          800: "#221808",
          700: "#2d2010",
          600: "#3a2a14",
          500: "#4a3520",
        },
        cream: "#f5ead8",
        parchment: "#f0e6d0",
        charcoal: "#1c1410",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        script: ["Palatino Linotype", "Palatino", "serif"],
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "coffee-gradient": "linear-gradient(135deg, #2c1709 0%, #4e2c16 40%, #3a2010 100%)",
        "board-gradient": "linear-gradient(180deg, #1a1208 0%, #2d2010 50%, #221808 100%)",
        "warm-vignette": "radial-gradient(ellipse at center, transparent 40%, rgba(20,10,4,0.7) 100%)",
        "gold-shimmer": "linear-gradient(135deg, #d4a017 0%, #f0d060 50%, #d4a017 100%)",
      },
      boxShadow: {
        "warm-lg": "0 20px 60px -10px rgba(44, 23, 9, 0.6)",
        "warm-sm": "0 4px 20px rgba(44, 23, 9, 0.4)",
        "gold-glow": "0 0 20px rgba(212, 160, 23, 0.3)",
        "interviewer": "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 10px rgba(212,160,23,0.2)" }, "50%": { boxShadow: "0 0 30px rgba(212,160,23,0.5)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
    },
  },
  plugins: [],
};

export default config;
