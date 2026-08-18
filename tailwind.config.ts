import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          accent: "var(--gold-accent)",
        },
        canvas: {
          DEFAULT: "var(--bg)",
          deep: "var(--bg-deep)",
          alt: "var(--bg-alt)",
          alt2: "var(--bg-alt-2)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          alt: "var(--surface-alt)",
          raised: "var(--surface-raised)",
        },
        line: {
          DEFAULT: "var(--border)",
          soft: "var(--border-soft)",
          faint: "var(--border-faint)",
        },
        ink: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
          faint: "var(--text-faint)",
          dim: "var(--text-dim)",
        },
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      }
    },
  },
  plugins: [],
};
export default config;
