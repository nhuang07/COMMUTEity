/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        success: "#16A34A",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
      },
    },
  },
  plugins: [],
}