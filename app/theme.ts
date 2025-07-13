const theme = {
  colors: {
    primary: '#010101',
    primaryDark: '#141414',
    secondary: '#F9B023',
    secondaryLight: '#FFC83A',
    text: '#010101',
    textLight: '#616A7D',
    background: '#eee8dc',
    white: '#f7ebdf',
    border: '#eee8dc',
    success: '#eee8dc',
    error: '#FF3B30',
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    xxl: 30,
    full: 9999, // For circular elements like buttons
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  text: {
    h1: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 32,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 28,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      lineHeight: 20,
    },
    caption: {
      fontSize: 14,
      lineHeight: 18,
      color: '#616A7D',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
  },
} as const;

export type Theme = typeof theme;

export default theme;
