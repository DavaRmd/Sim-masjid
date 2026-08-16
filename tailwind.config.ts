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
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          dark: "#2A5230",
          light: "#EAF2EB",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Divine Minimalist semantic tokens (hardcoded for direct use)
        forest: "#0A2E1F",
        cream: "#F9F6F0",
        "cream-border": "#F0EBE1",
        gold: "#D4AF37",
        sage: "#8D9F96",
        moss: "#15221C",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "0.5rem",
        md: "16px",
        lg: "24px",
        xl: "calc(var(--radius) + 4px)",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Amiri", "serif"],
      },
      boxShadow: {
        ambient: "0 20px 40px -15px rgba(10, 46, 31, 0.08)",
        hover: "0 30px 60px -20px rgba(10, 46, 31, 0.14)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
