const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ addVariant, e }) => {
    addVariant('is-active', [ '.is-active &', '&.is-active' ]);
});
