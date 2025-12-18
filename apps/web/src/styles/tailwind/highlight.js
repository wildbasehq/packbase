import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

export default function ({addUtilities, matchUtilities, theme}) {
    matchUtilities(
        {
            'bg-gradient': (value) => {
                return {
                    '--panel-ring': value,
                    boxShadow: [
                        'inset 0 0 0 1px var(--panel-ring)',
                        'inset 0 2px 0 rgba(255,255,255,0.12)',
                        'inset 0 0 2px 2px rgba(255,255,255,0.06)',
                        // '0 16px 36px -6px rgba(0,0,0,0.36)',
                        // '0 6px 16px -2px rgba(0,0,0,0.2)',
                    ].join(', '),
                };
            },
        },
        {
            type: 'color',
            values: flattenColorPalette(theme('backgroundColor'))
        }
    );

    matchUtilities(
        {
            'shadow-panel': (value) => {
                return {
                    '--panel-ring': value,
                    boxShadow: [
                        'inset 0 0 0 1px var(--panel-ring)',
                        'inset 0 2px 0 rgba(255,255,255,0.12)',
                        'inset 0 0 2px 2px rgba(255,255,255,0.06)',
                        '0 16px 36px -6px rgba(0,0,0,0.36)',
                        '0 6px 16px -2px rgba(0,0,0,0.2)',
                    ].join(', '),
                };
            },
        },
        {
            type: 'color',
            values: flattenColorPalette(theme('backgroundColor'))
        }
    );
}
