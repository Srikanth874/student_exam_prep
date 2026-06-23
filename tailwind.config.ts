import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#070A12",
        ink: "#0D1324",
        panel: "#11182D",
        aurora: "#5EEAD4",
        violet: "#8B5CF6",
        solar: "#FBBF24"
      },
      boxShadow: {
        glow: "0 0 40px rgba(94, 234, 212, 0.22)",
        depth: "0 28px 70px rgba(0, 0, 0, 0.46)"
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 7s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotateX(0deg)" },
          "50%": { transform: "translateY(-14px) rotateX(3deg)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" }
        }
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
