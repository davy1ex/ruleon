/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          ribbon: "var(--color-bg-ribbon)",
          sidebar: "var(--color-bg-sidebar)",
          workspace: "var(--color-bg-workspace)",
          "tab-bar": "var(--color-bg-tab-bar)",
          "tab-active": "var(--color-bg-tab-active)",
          "tab-inactive": "var(--color-bg-tab-inactive)",
          modal: "var(--color-bg-modal)",
          overlay: "var(--color-bg-modal-overlay)",
          input: "var(--color-bg-input)",
          code: "var(--color-bg-code)",
        },
        text: {
          normal: "var(--color-text-normal)",
          muted: "var(--color-text-muted)",
          emphasis: "var(--color-text-emphasis)",
          "on-accent": "var(--color-text-on-accent)",
          link: "var(--color-text-link)",
          danger: "var(--color-text-danger)",
          warning: "var(--color-text-warning)",
          success: "var(--color-text-success)",
          DEFAULT: "var(--color-text-normal)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
        },
        divider: "var(--color-divider)",
        accent: {
          DEFAULT: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",
        },
        interactive: {
          hover: "var(--color-surface-hover)",
          active: "var(--color-surface-active)",
          selected: "var(--color-surface-selected)",
        },
        status: {
          success: "var(--color-status-success)",
          warning: "var(--color-status-warning)",
          error: "var(--color-status-error)",
          info: "var(--color-status-info)",
        },
        bullet: {
          DEFAULT: "var(--color-bullet)",
          hover: "var(--color-bullet-hover)",
        },
        "guide-line": "var(--color-guide-line)",
        selection: "var(--color-selection)",
      },
      spacing: {
        ribbon: "var(--size-ribbon-width)",
        "tab-bar": "var(--size-tab-height)",
      },
    },
  },
  plugins: [],
};
