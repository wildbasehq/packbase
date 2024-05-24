/** @type {Plugin} */
const plugin = require("tailwindcss/plugin");
const {default: flattenColorPalette} = require('tailwindcss/lib/util/flattenColorPalette');

// Generate safelist for each colour in the palette, just bg-*-600, dark:bg-*-700.
let safelist = [];
const colors = require('tailwindcss/colors');
for (const key of Object.keys(colors)) {
    if (key !== 'inherit' && key !== 'current' && key !== 'transparent' && key !== 'black' && key !== 'white') {
        safelist.push(`text-${key}-200`);
        safelist.push(`bg-${key}-600`);
        safelist.push(`bg-${key}-700`);
        safelist.push(`dark:bg-${key}-700`);
        safelist.push(`dark:bg-${key}-800`);
    }
}

module.exports = {
    content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    darkMode: 'class',
    safelist: [
        'bg-neutral-50',
        'dark:bg-neutral-700',
        'dark:bg-neutral-800',
        'text-neutral-900',
        'dark:text-neutral-300',
        'divide-neutral-200',
        'dark:divide-neutral-700',
        ...safelist,

        // for skeleton loader
        'h-32',
        'h-48',
        'h-40',
        'h-56',
    ],
    future: {
        hoverOnlyWhenSupported: true,
    },
    theme: {
        extend: {
            colors: {
                code: {
                    highlight: 'rgb(125 211 252 / 0.1)',
                },
                // neutral: defaultColors.zinc,

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
            fontFamily: {
                display: ["var(--font-lexend)", "system-ui", "sans-serif"],
                default: ["var(--font-lexend)", "system-ui", "sans-serif"],
            },
            animation: {
                shimmer: "shimmer 1s infinite linear",
                // Fade up and down
                "fade-up": "fade-up 0.5s",
                "fade-down": "fade-down 0.5s",
                // Tooltip
                "slide-up-fade": "slide-up-fade 0.3s cubic-bezier(0,1.25,0,1)",
                "slide-down-fade": "slide-down-fade 0.3s cubic-bezier(0,1.25,0,1)",
            },
            keyframes: {
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
                    "0%": {opacity: 0, transform: "translateY(6px)"},
                    "100%": {opacity: 1, transform: "translateY(0)"},
                },
                "slide-down-fade": {
                    "0%": {opacity: 0, transform: "translateY(-6px)"},
                    "100%": {opacity: 1, transform: "translateY(0)"},
                },
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
        require("tailwindcss-inner-border"),
        require('tailwindcss-animate'),
        plugin(({addVariant}) => {
            addVariant("radix-side-top", '&[data-side="top"]');
            addVariant("radix-side-bottom", '&[data-side="bottom"]');
        }),
        plugin(function ({addVariant}) {
            addVariant('low-fidelity', 'html.low-fidelity &')
            addVariant('unicorn', 'html[data-unicorn-engine] &')
        }),
        function ({matchUtilities, theme}) {
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
