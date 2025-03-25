import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Core color palette
export const COLORS = {
  // Primary colors
  primary: '#1976D2', // New main blue color (was #ff6b6b)
  primaryLight: '#42a5f5',
  primaryDark: '#0d47a1',
  
  // Secondary colors
  secondary: '#ff6b6b', // Move coral to secondary
  secondaryLight: '#ff8a8a',
  secondaryDark: '#e35252',
  
  // Accent colors
  accent: '#4CAF50', // Green for positive actions
  accentLight: '#81c784',
  accentDark: '#2e7d32',
  
  warning: '#FFC107', // Yellow for warnings/alerts
  error: '#F44336', // Red for errors/negative actions
  
  // Neutral colors
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9e9e9e',
  border: '#e0e0e0',
  divider: '#eeeeee',
  
  // UI State colors
  disabled: '#bdbdbd',
  placeholder: '#9e9e9e',
  highlight: 'rgba(25, 118, 210, 0.1)',
};

// Typography
export const FONTS = {
  // Font families
  regular: 'System',
  medium: 'System',
  bold: 'System',
  
  // Font sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  label: 14,
  caption: 12,
  small: 10,
  
  // Line heights
  lineHeightHeading: 1.3,
  lineHeightBody: 1.5,
};

// Spacing system
export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  
  screenPadding: 16,
  cardPadding: 16,
};

// Borders & Radiuses
export const BORDERS = {
  radiusSmall: 4,
  radiusMedium: 8,
  radiusLarge: 16,
  radiusXL: 24,
  radiusRound: 100, // For circular elements
  
  widthThin: 1,
  widthMedium: 2,
  widthThick: 3,
};

// Shadows for different elevations
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.0,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5.0,
    elevation: 5,
  },
  extraLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8.0,
    elevation: 8,
  },
};

// Common component styles
export const COMPONENT_STYLES = {
  // Card styles
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.cardPadding,
    ...SHADOWS.medium,
  },
  
  // Button styles
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDERS.radiusMedium,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: BORDERS.widthThin,
    borderColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
  buttonTextOutline: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
  
  // Input styles
  input: {
    borderWidth: BORDERS.widthThin,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radiusMedium,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    fontSize: FONTS.body,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.l,
    backgroundColor: COLORS.card,
    borderBottomWidth: BORDERS.widthThin,
    borderBottomColor: COLORS.divider,
  },
  
  // Screen/Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // List item styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.screenPadding,
    borderBottomWidth: BORDERS.widthThin,
    borderBottomColor: COLORS.divider,
  },
};

// Screen dimensions helpers
export const DIMENSIONS = {
  screenWidth: width,
  screenHeight: height,
  cardWidth: width * 0.9,
  cardHeight: height * 0.7,
};

// Animation presets
export const ANIMATIONS = {
  springConfig: {
    damping: 20,
    stiffness: 200,
  },
  timingFast: 200,
  timingNormal: 300,
  timingSlow: 500,
};

export default {
  COLORS,
  FONTS,
  SPACING,
  BORDERS,
  SHADOWS,
  COMPONENT_STYLES,
  DIMENSIONS,
  ANIMATIONS,
};