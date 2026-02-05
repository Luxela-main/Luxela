import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config & { safelist?: string[] } = {
  content: [
  "./pages/**/*.{ts,tsx,js,jsx}",
  "./components/**/*.{ts,tsx,js,jsx}",
  "./app/**/*.{ts,tsx,js,jsx}",
  "./src/**/*.{ts,tsx,js,jsx}",
  "./lib/**/*.{ts,tsx,js,jsx}",
  "./utils/**/*.{ts,tsx,js,jsx}",
  ],
  safelist: [
    // status colors
    'text-blue-400','bg-blue-500/10','text-yellow-400','bg-yellow-500/10','text-green-400','bg-green-500/10','text-gray-400','bg-gray-500/10',
    // priority / restock / stock statuses
    'text-red-500','bg-red-500/10','border-red-500/30','text-orange-500','bg-orange-500/10','border-orange-500/30','text-yellow-500','bg-yellow-500/10','text-blue-500','bg-blue-500/10','text-green-500','bg-green-500/10',
    // admin support variants
    'text-orange-400','text-red-400','bg-red-500/20',
    // scrollbar utility
    'scrollbar-thin','scrollbar-thumb-gray-700','scrollbar-track-gray-900/50','hover:scrollbar-thumb-gray-600'
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#8451E1",
          700: "#733AD4",
          800: "#6d28d9",
          900: "#581c87",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    animatePlugin,
    function ({ addUtilities }: any) {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    },
  ],
} satisfies Config & { safelist?: string[] }

export default config