/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#10b981", // emerald accent tied to the WhatsApp/brand identity
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
