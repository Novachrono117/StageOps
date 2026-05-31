import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: "#07080d",
          panel: "#10131d",
          panelSoft: "#151927",
          line: "rgba(255, 255, 255, 0.1)",
          text: "#f6f7fb",
          muted: "#a6adbb",
          purple: "#7c3aed",
          cyan: "#06b6d4",
          green: "#22c55e",
          amber: "#f59e0b",
          red: "#ef4444"
        }
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.34)"
      }
    }
  },
  plugins: []
};

export default config;
