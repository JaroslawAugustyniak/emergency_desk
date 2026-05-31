import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'selector', // To pozwala next-themes sterować motywem za pomocą klasy .dark
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
