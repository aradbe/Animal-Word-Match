import { createTheme } from "@mantine/core";

// Warm, playful "Animal Word Match" theme (from the agreed mockup).
export const theme = createTheme({
  primaryColor: "brandTeal",
  primaryShade: 6,
  defaultRadius: "lg", // rounded cards / inputs / buttons
  fontFamily: "Fredoka, ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
  headings: {
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif",
    fontWeight: "700",
  },
  colors: {
    // teal — the primary "Let's go!" green
    brandTeal: [
      "#E6F7F3", "#CBEDE5", "#9FDECF", "#6FCFBA", "#48C2A8",
      "#2EB89C", "#1FA890", "#178A77", "#106E5F", "#0A5749",
    ],
    // coral — the "Match" accent
    coral: [
      "#FDEFEC", "#FBDCD5", "#F8C1B6", "#F5A594", "#F28E7B",
      "#F0836F", "#EF7E6C", "#DB6350", "#BE4B39", "#9C3A2B",
    ],
    // warm orange — badge ring / streak
    sunny: [
      "#FEF5E4", "#FCE7C2", "#F9D594", "#F7C566", "#F5B549",
      "#F4AC3E", "#F4A93C", "#D98B20", "#B06E16", "#8A560F",
    ],
  },
});
