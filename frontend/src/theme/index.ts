import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e8fbf0',
    100: '#c3f3d7',
    200: '#8fe6b3',
    300: '#5cd88f',
    400: '#34cc72',
    500: '#22c55e',
    600: '#189b4a',
    700: '#127339',
    800: '#0c4d27',
    900: '#062713',
  },
  accent: {
    500: '#f5a623',
    600: '#d68d13',
  },
  danger: {
    500: '#ef5350',
  },
};

// Dark is the default (matches the design), but every one of these has a light
// counterpart so the whole app — cards, borders, muted/primary text, charts —
// flips cleanly with the color mode toggle instead of just the page background.
const semanticTokens = {
  colors: {
    surface: {
      bg: { default: '#f7f8fa', _dark: '#0b0e11' },
      panel: { default: '#ffffff', _dark: '#12161b' },
      panelAlt: { default: '#f1f3f5', _dark: '#171c22' },
      border: { default: '#e2e8f0', _dark: '#232a32' },
      muted: { default: '#64748b', _dark: '#8b95a1' },
    },
    text: {
      primary: { default: '#111827', _dark: '#f5f6f7' },
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'surface.bg',
        color: 'text.primary',
      },
    },
  },
  components: {
    Table: {
      variants: {
        simple: {
          th: {
            color: 'surface.muted',
            borderColor: 'surface.border',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 'xs',
          },
          td: {
            borderColor: 'surface.border',
          },
        },
      },
    },
  },
});
