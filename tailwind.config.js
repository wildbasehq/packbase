const plugin = require('tailwindcss/plugin')
const flattenColorPalette = require("tailwindcss/lib/util/flattenColorPalette");

module.exports = {
    plugins: [
        plugin(({ addVariant }) => {
            addVariant('radix-side-top', '&[data-side="top"]')
            addVariant('radix-side-bottom', '&[data-side="bottom"]')
            addVariant('low-fidelity', 'html.low-fidelity &')
            addVariant('unicorn', 'html[data-unicorn-engine] &')
        }),
        require('tailwindcss-animate'),
        // require('@tailwindcss/forms'),
        // require('tailwindcss-inner-border'),
        function ({ matchUtilities, theme }) {
            matchUtilities(
                {
                    highlight: (value) => ({ boxShadow: `inset 0 1px 0 0 ${value}` }),
                },
                {
                    values: flattenColorPalette(theme('backgroundColor')),
                    type: 'color',
                },
            )
        },
    ],
}