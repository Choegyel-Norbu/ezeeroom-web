/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // we'll add custom styles here
      colors: {
        primary: "#00b8e6",
        secondary: "#ff6f61",
        accent: "#f4d35e",
      },
      animation: {
        "spinner-blade": "spinner-blade 1s linear infinite",
        "scale-in": "scale-in 0.5s ease-out",
      },
      keyframes: {
        "spinner-blade": {
          "0%": { opacity: "0.85" },
          "50%": { opacity: "0.25" },
          "100%": { opacity: "0.25" },
        },
        "scale-in": {
          "0%": { transform: "scale(0)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
