/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F17',
          card: '#131B2E',
          border: '#1E293B',
          muted: '#64748B',
          accent: '#38BDF8'
        }
      }
    },
  },
  plugins: [],
}
