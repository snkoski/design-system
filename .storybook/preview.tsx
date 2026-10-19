import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import "./storybook.css";

const preview: Preview = {
  decorators: [
    // Toolbar switch: sets data-theme on <html>, exactly as a real site would
    withThemeByDataAttribute({
      themes: { Light: "light", Dark: "dark", "Hot dog": "hotdog" },
      defaultTheme: "Light",
      attributeName: "data-theme",
      parentSelector: "html",
    }),
  ],
  parameters: {
    layout: "centered",
    backgrounds: { disable: true }, // the theme sets the background
    controls: { expanded: true, sort: "requiredFirst" },
    a11y: { test: "error" }, // accessibility violations fail the story
    options: {
      storySort: {
        order: [
          "Foundations",
          ["Introduction", "Voice and copy", "Color", "Typography", "Spacing, layout, and shape", "Motion", "Iconography", "Accessibility", "Building"],
          "Components",
        ],
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
