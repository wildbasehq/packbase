// prettier.config.js
module.exports = {
    bracketSpacing: true,
    semi: false,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 170,
    tabWidth: 4,
    htmlWhitespaceSensitivity: 'ignore',
    plugins: [require('prettier-plugin-tailwindcss')],
}
