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
  surface: {
    bg: '#0b0e11',
    panel: '#12161b',
    panelAlt: '#171c22',
    border: '#232a32',
    muted: '#8b95a1',
  },
};

export const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: colors.surface.bg,
        color: 'gray.100',
      },
    },
  },
  components: {
    Table: {
      variants: {
        simple: {
          th: {
            color: colors.surface.muted,
            borderColor: colors.surface.border,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 'xs',
          },
          td: {
            borderColor: colors.surface.border,
          },
        },
      },
    },
  },
});
