import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        celo: { yellow: "#FCFF52", dark: "#1E002B", forest: "#476520" },
      },
    },
  },
  plugins: [],
} satisfies Config;
