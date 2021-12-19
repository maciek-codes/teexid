module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      aspectRatio: {
        '12/8': '12 / 8'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
