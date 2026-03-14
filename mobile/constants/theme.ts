import { Platform } from 'react-native';

export const Colors = {
  bg: '#000000',
  bgCard: '#0A0A0A',
  bgCardLight: '#141414',
  bgElevated: '#1A1A1A',

  accent: '#5CE0D2',
  accentDim: 'rgba(92, 224, 210, 0.08)',
  accentMuted: 'rgba(92, 224, 210, 0.35)',

  green: '#5CE0D2',
  greenDim: 'rgba(92, 224, 210, 0.06)',
  red: '#FF4757',
  redDim: 'rgba(255, 71, 87, 0.06)',
  yellow: '#AAAAAA',

  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#777777',
  textMuted: '#444444',

  border: '#1A1A1A',
  borderLight: '#252525',
};

export const Fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

export const Radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 100,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const superellipse = (radius: number) =>
  ({
    borderRadius: radius,
    borderCurve: 'continuous' as const,
  }) as const;
