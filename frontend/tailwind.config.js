/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        creme: "#FAF9F6",
        ink: "#2C1D1D",
        espresso: "#4A3737",
        rose: "#B76E79",
        rosedark: "#a35c67",
        pessego: "#E5B299",
        taupe: "#8C7A7A",
        gold: "#D4AF37",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Montserrat"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
