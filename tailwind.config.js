/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elora: {
          purple: "#6C63FF",
          dark: "#1F1F2E",
          light: "#F7F7FA"
        }
      }
    },
  },
  plugins: [],
}
