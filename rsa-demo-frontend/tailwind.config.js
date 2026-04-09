import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
          "background": "#f9f9f9",
          "secondary-container": "#e2e2e9",
          "primary": "#565e74",
          "primary-dim": "#4a5268",
          "on-tertiary-fixed": "#393751",
          "inverse-primary": "#dae2fd",
          "on-error-container": "#752121",
          "surface-container-high": "#e4e9ea",
          "on-tertiary-container": "#4b4a65",
          "primary-fixed": "#dae2fd",
          "surface-container": "#ebeeef",
          "surface-bright": "#f9f9f9",
          "tertiary-container": "#dad6f7",
          "on-error": "#fff7f6",
          "tertiary-fixed-dim": "#ccc9e9",
          "error": "#9f403d",
          "inverse-surface": "#0c0f0f",
          "surface-container-low": "#f2f4f4",
          "surface-variant": "#dde4e5",
          "on-secondary-container": "#505157",
          "secondary": "#5d5f65",
          "secondary-fixed": "#e2e2e9",
          "outline-variant": "#acb3b4",
          "tertiary": "#5e5c78",
          "on-secondary": "#f9f8ff",
          "on-primary": "#f7f7ff",
          "on-secondary-fixed": "#3d3f45",
          "tertiary-dim": "#52506b",
          "secondary-fixed-dim": "#d4d4db",
          "on-primary-container": "#4a5167",
          "surface": "#f9f9f9",
          "outline": "#757c7d",
          "on-surface": "#2d3435",
          "surface-container-highest": "#dde4e5",
          "error-container": "#fe8983",
          "on-primary-fixed-variant": "#535b71",
          "on-background": "#2d3435",
          "on-primary-fixed": "#373f54",
          "surface-tint": "#565e74",
          "primary-fixed-dim": "#ccd4ee",
          "error-dim": "#4e0309",
          "secondary-dim": "#515359",
          "tertiary-fixed": "#dad6f7",
          "surface-dim": "#d3dbdd",
          "inverse-on-surface": "#9c9d9d",
          "surface-container-lowest": "#ffffff",
          "primary-container": "#dae2fd",
          "on-tertiary-fixed-variant": "#55536f",
          "on-secondary-fixed-variant": "#5a5b61",
          "on-surface-variant": "#596061",
          "on-tertiary": "#fcf7ff"
      },
      "borderRadius": {
          "DEFAULT": "1rem",
          "lg": "1.5rem",
          "xl": "2rem",
          "2xl": "2.5rem",
          "3xl": "3rem",
          "full": "9999px"
      },
      "fontFamily": {
          "headline": ["Manrope", "Girassol", "serif"],
          "body": ["Inter", "sans-serif"],
          "label": ["Inter", "sans-serif"],
          "brand": ["Girassol", "serif"],
          "mono": ["JetBrains Mono", "monospace"],
          "display": ["Inter", "sans-serif"]
      },
      "animation": {
          "fade-in-up": "fade-in-up 0.8s ease-out forwards",
          "gradient": "gradient 15s ease infinite",
          "float": "float 12s ease-in-out infinite",
          "float-delayed": "float 18s ease-in-out infinite 2s",
          "slide-up": "slide-up 1s ease-out forwards",
      },
      "keyframes": {
          "fade-in-up": {
              "0%": { opacity: "0", transform: "translateY(20px)" },
              "100%": { opacity: "1", transform: "translateY(0)" },
          },
          "slide-up": {
              "0%": { opacity: "0", transform: "translateY(40px)" },
              "100%": { opacity: "1", transform: "translateY(0)" },
          },
          "gradient": {
              "0%, 100%": { "background-position": "0% 50%" },
              "50%": { "background-position": "100% 50%" },
          },
          "float": {
              "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
              "50%": { transform: "translateY(-40px) rotate(2deg)" },
          }
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
