const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ matchUtilities, addComponents, addUtilities, theme }) => {
    matchUtilities({
        'clamp': value => ({
            '-webkit-line-clamp': value,
            'display': '-webkit-box',
            'overflow': 'hidden',
            '-webkit-box-orient': 'vertical'
        })
    }, {
        type: 'any',
        values: {
            '1': '1',
            '2': '2',
            '3': '3',
            '4': '4',
            '5': '5',
            '6': '6',
            '7': '7',
            '8': '8',
            '9': '9',
            '10': '10'
        }
    });
});
