import { heroui } from '@heroui/react';

export default heroui({
  defaultTheme: 'dark',
  layout: {
    radius: {
      small: '6px',
      medium: '10px',
      large: '12px',
    },
    boxShadow: {
      small: 'none',
      medium: 'none',
      large: 'none',
    },
  },
  themes: {
    dark: {
      colors: {
        background: '#07080A',
        foreground: '#F2F4F7',
        focus: '#3BE8B0',
        divider: 'rgba(255,255,255,0.08)',
        overlay: '#07080A',
        content1: '#0E1013',
        content2: '#14171B',
        content3: '#1B1F25',
        content4: '#232830',
        default: {
          50: '#232830',
          100: '#1B1F25',
          200: '#181C21',
          300: '#14171B',
          400: '#12151A',
          500: '#0E1013',
          600: '#0C0E11',
          700: '#0A0C0E',
          800: '#08090B',
          900: '#07080A',
          DEFAULT: '#1B1F25',
          foreground: '#F2F4F7',
        },
        primary: {
          50: '#E8FFF6',
          100: '#C6FBE8',
          200: '#8FF6D3',
          300: '#5CEFC1',
          400: '#3BE8B0',
          500: '#3BE8B0',
          600: '#22C995',
          700: '#179872',
          800: '#0F6B51',
          900: '#0A4636',
          DEFAULT: '#3BE8B0',
          foreground: '#07080A',
        },
        danger: {
          DEFAULT: '#FF6B6B',
          foreground: '#07080A',
        },
      },
    },
  },
});
