/** @type {import('tailwindcss').Config} */
export default {
  // Change this from 'media' (which follows browser) to 'class' (which follows your button)
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}