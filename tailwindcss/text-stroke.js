const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ matchUtilities, addComponents, addUtilities, theme }) => {
    matchUtilities({
        'text-stroke': value => ({
            '-webkit-text-stroke-width': value
        })
    }, {
        type: 'length',
        values: theme('borderWidth')
    });

    matchUtilities({
        'text-stroke': value => ({
            '-webkit-text-stroke-color': value
        })
    }, {
        type: 'color',
        values: theme('colors')
    });
});
