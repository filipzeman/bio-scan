// src/styles/theme.ts
import { MD3LightTheme as DefaultTheme, MD3Theme } from "react-native-paper";

/**
 * Paper theme (only MD3 keys) — safe for PaperProvider
 */
export const paperTheme: MD3Theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: "#4CAF50", // app primary
        secondary: "#00796B",
        // leave the rest as defaults (onSurface, surface, background, etc.)
    },
};

/**
 * App-level semantic colors (not injected into MD3Theme.colors).
 * Use these for things like success/warning/danger in your own components.
 */
export const semanticColors = {
    success: "#2ecc71",
    warning: "#f1c40f",
    danger: "#e74c3c",
    accent: "#007AFF",
};

/**
 * Spacing and typography tokens
 */
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const typography = {
    title: 24,
    subtitle: 18,
    body: 14,
    caption: 12,
};

/**
 * Default export for convenience. You can import individual pieces too.
 */
export default {
    paperTheme,
    semanticColors,
    spacing,
    typography,
};
