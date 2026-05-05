/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        bg: {
          page: "#050505",
          surface: "#0A0A0A",
          elevated: "#121212",
        },
        ink: {
          DEFAULT: "#F4F4F5",
          dim: "#A1A1AA",
          mute: "#71717A",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          hover: "rgba(255,255,255,0.2)",
        },
        signal: {
          DEFAULT: "#FF4500",
          hover: "#E63E00",
          glow: "rgba(255, 69, 0, 0.18)",
        },
        safe: "#00E599",
        risk: "#FF3366",
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', '"Manrope"', "system-ui", "sans-serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        pulseGlow: { "0%,100%": { opacity: 0.4 }, "50%": { opacity: 1 } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
