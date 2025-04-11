import { createTheme } from "@mantine/core";
import type { MantineThemeOverride } from "@mantine/core";

const theme: MantineThemeOverride = createTheme({
  breakpoints: {
    xs: '30em',
    sm: '48em',
    md: '64em',
    lg: '74em',
    xl: '90em',
  },
  fontFamily: '"Inter", "Noto SansJP", "Noto Sans JP", "Noto Sans", sans-serif',
  headings: {
    fontFamily: '"Inter", "Noto SansJP", "Noto Sans JP", "Noto Sans", sans-serif',
  }
});

export default theme;
