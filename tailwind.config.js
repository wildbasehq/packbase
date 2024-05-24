const {default: flattenColorPalette} = require('tailwindcss/lib/util/flattenColorPalette');
// const defaultColors = require('tailwindcss/colors');
const plugin = require("tailwindcss/plugin");

module.exports = {
    darkMode: 'class',
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            animation: {
                logoHue: 'logoHue 1s ease-out, logoHue 30s ease-out 1s infinite',
                // Hue rotate
                hue: "hue 1s ease-out",
                // Shimmer
                shimmer: "shimmer 1s ease-out infinite",
                // Fade up and down
                "fade-up": "fade-up 0.5s",
                "fade-down": "fade-down 0.5s",
                // Tooltip
                "slide-up-fade": "slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                "slide-down-fade": "slide-down-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                "slide-up-fade-snapper": "slide-up-fade 0.3s cubic-bezier(0, 1.25, 0, 1) forwards",
                "slide-down-fade-snapper": "slide-down-fade 0.3s cubic-bezier(0, 1.25, 0, 1)",
                // Charm
                "magic-sparkle": "magic-sparkle 1.5s forwards",
            },
            keyframes: {
                hue: {
                    "0%": { filter: "hue-rotate(0deg)" },
                    "100%": { filter: "hue-rotate(360deg)" },
                },
                shimmer: {
                    '100%': {
                        transform: 'translateX(100%)',
                    },
                },
                // Fade up and down
                "fade-up": {
                    "0%": {
                        opacity: 0,
                        transform: "translateY(10px)",
                    },
                    "80%": {
                        opacity: 0.6,
                    },
                    "100%": {
                        opacity: 1,
                        transform: "translateY(0px)",
                    },
                },
                "fade-down": {
                    "0%": {
                        opacity: 0,
                        transform: "translateY(-10px)",
                    },
                    "80%": {
                        opacity: 0.6,
                    },
                    "100%": {
                        opacity: 1,
                        transform: "translateY(0px)",
                    },
                },
                // Tooltip
                "slide-up-fade": {
                    "0%": { opacity: 0, transform: "translateY(6px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                "slide-down-fade": {
                    "0%": { opacity: 0, transform: "translateY(-6px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                // Charm
                "magic-sparkle": {
                    "0%": {
                        transform: "scale(0)",
                    },
                    "50%": {
                        transform: "scale(1)",
                    },
                    "100%": {
                        transform: "scale(0)",
                    },
                },
            },
            colors: {
                code: {
                    highlight: 'rgb(125 211 252 / 0.1)',
                },
                // neutral: defaultColors.zinc,
                sidebar: {
                    default: '#ffffff',
                    dark: '#1b1b1c',
                },

                accent: {
                    1: 'rgb(var(--color-accent-1) / <alpha-value>)',
                    5: 'rgb(var(--color-accent-5) / <alpha-value>)',
                },
                n: {
                    1: 'rgb(var(--color-n-1) / <alpha-value>)',
                    2: 'rgb(var(--color-n-2) / <alpha-value>)',
                    3: 'rgb(var(--color-n-3) / <alpha-value>)',
                    4: 'rgb(var(--color-n-4) / <alpha-value>)',
                    5: 'rgb(var(--color-n-5) / <alpha-value>)',
                    6: 'rgb(var(--color-n-6) / <alpha-value>)',
                    7: 'rgb(var(--color-n-7) / <alpha-value>)',
                    8: 'rgb(var(--color-n-8) / <alpha-value>)',
                },
                body: {
                    DEFAULT: 'rgb(var(--color-n-1) / <alpha-value>)',
                    dark: 'rgb(var(--color-n-8) / <alpha-value>)',
                },

                // Material Design Dynamic Color Palette
                // https://material.io/design/color/dark-theme.html#ui-application
                primary: {
                    DEFAULT: 'rgb(var(--md-sys-primary) / <alpha-value>)',
                    container: 'rgb(var(--md-sys-primary-container) / <alpha-value>)',
                    inverse: 'rgb(var(--md-sys-inverse-primary) / <alpha-value>)',
                    feral: 'rgb(var(--color-primary-1) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'rgb(var(--md-sys-secondary) / <alpha-value>)',
                    container: 'rgb(var(--md-sys-secondary-container) / <alpha-value>)',
                },
                tertiary: {
                    DEFAULT: 'rgb(var(--md-sys-tertiary) / <alpha-value>)',
                    container: 'rgb(var(--md-sys-tertiary-container) / <alpha-value>)',
                },
                error: {
                    DEFAULT: 'rgb(var(--md-sys-error) / <alpha-value>)',
                    container: 'rgb(var(--md-sys-error-container) / <alpha-value>)',
                },
                background: {
                    DEFAULT: 'rgb(var(--md-sys-background) / <alpha-value>)',
                },
                surface: {
                    DEFAULT: 'rgb(var(--md-sys-surface) / <alpha-value>)',
                    variant: 'rgb(var(--md-sys-surface-variant) / <alpha-value>)',
                    inverse: 'rgb(var(--md-sys-inverse-surface) / <alpha-value>)',
                    dim: 'rgb(var(--md-sys-surface-dim) / <alpha-value>)',
                    bright: 'rgb(var(--md-sys-surface-bright) / <alpha-value>)',
                    container: {
                        lowest: 'rgb(var(--md-sys-surface-container-lowest) / <alpha-value>)',
                        low: 'rgb(var(--md-sys-surface-container-low) / <alpha-value>)',
                        DEFAULT: 'rgb(var(--md-sys-surface-container) / <alpha-value>)',
                        high: 'rgb(var(--md-sys-surface-container-high) / <alpha-value>)',
                        highest: 'rgb(var(--md-sys-surface-container-highest) / <alpha-value>)',
                    }
                },
                outline: {
                    DEFAULT: 'rgb(var(--md-sys-outline) / <alpha-value>)',
                    variant: 'rgb(var(--md-sys-outline-variant) / <alpha-value>)',
                },
                shadow: {
                    DEFAULT: 'rgb(var(--md-sys-shadow) / <alpha-value>)',
                },
                scrim: {
                    DEFAULT: 'rgb(var(--md-sys-scrim) / <alpha-value>)',
                },
                on: {
                    primary: {
                        DEFAULT: 'rgb(var(--md-sys-on-primary) / <alpha-value>)',
                        container: 'rgb(var(--md-sys-on-primary-container) / <alpha-value>)',
                    },
                    secondary: {
                        DEFAULT: 'rgb(var(--md-sys-on-secondary) / <alpha-value>)',
                        container: 'rgb(var(--md-sys-on-secondary-container) / <alpha-value>)',
                    },
                    tertiary: {
                        DEFAULT: 'rgb(var(--md-sys-on-tertiary) / <alpha-value>)',
                        container: 'rgb(var(--md-sys-on-tertiary-container) / <alpha-value>)',
                    },
                    error: {
                        DEFAULT: 'rgb(var(--md-sys-on-error) / <alpha-value>)',
                        container: 'rgb(var(--md-sys-on-error-container) / <alpha-value>)',
                    },
                    background: {
                        DEFAULT: 'rgb(var(--md-sys-on-background) / <alpha-value>)',
                    },
                    surface: {
                        DEFAULT: 'rgb(var(--md-sys-on-surface) / <alpha-value>)',
                        variant: 'rgb(var(--md-sys-on-surface-variant) / <alpha-value>)',
                    }
                },
            },
            aspectRatio: {
                'banner': '3 / 1',
            },
            borderRadius: {
                default: '0.75rem',
            },
            transitionTimingFunction: {
                snapper: 'cubic-bezier(0,1.25,0,1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require("tailwindcss-inner-border"),
        plugin(({ addVariant }) => {
            addVariant("radix-side-top", '&[data-side="top"]');
            addVariant("radix-side-bottom", '&[data-side="bottom"]');
            addVariant('low-fidelity', 'html.low-fidelity &')
            addVariant('unicorn', 'html[data-unicorn-engine] &')
        }),
        function ({matchUtilities, theme,}) {
            matchUtilities(
                {
                    highlight: (value) => ({boxShadow: `inset 0 1px 0 0 ${value}`}),
                },
                {
                    values: flattenColorPalette(theme('backgroundColor')),
                    type: 'color',
                },
            )
        },
    ],
};
