const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ addUtilities, variants }) => {
    const utilities = {
        '.inset-center': {
            '@apply top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2': false
        },
        '.inset-x-center': {
            '@apply left-1/2 -translate-x-1/2': false
        },
        '.inset-y-center': {
            '@apply top-1/2 -translate-y-1/2': false
        }
    };

    addUtilities(utilities, variants('inset'));
});
