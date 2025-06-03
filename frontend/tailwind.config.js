/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      colors: {
        border: "#e0e0e0",
        input: "#ffffff",
        ring: "#1a73e8",
        background: "#ffffff",
        foreground: "#212121",
        primary: {
          DEFAULT: "#1a73e8",          // azul padrão
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#e8f0fe",          // azul bem claro
          foreground: "#1a73e8",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#4b5563",
        },
        accent: {
          DEFAULT: "#bfdbfe",
          foreground: "#1e3a8a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1f2937",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1f2937",
        },
        sidebar: {
          DEFAULT: "#f9fafb",
          foreground: "#111827",
          primary: "#1a73e8",
          'primary-foreground': "#ffffff",
          accent: "#c7d2fe",
          'accent-foreground': "#1e3a8a",
          border: "#e5e7eb",
          ring: "#1a73e8",
        }
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
  plugins: [require("tailwindcss-animate")],
}
