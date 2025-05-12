/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e8d9c5',
        secondary: '#1c0a0359',
        accent: '#331e00',
        light: '#f5f5f5',
        dark: '#311d06',
      },
      backgroundImage: {
        'board-light': "url('../assets/images/madeiraclara.jpg')",
        'board-dark': "url('../assets/images/madeiraescura.jpg')",
      }
    },
  },
  plugins: [],
}