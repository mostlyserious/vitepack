const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ matchUtilities, addComponents, addUtilities, addBase, theme }) => {
    addBase({
        ':root': {
            '--parallax-perspective': '100vh',
            '--parallax-control': '0',
            '--parallax-x': '0px',
            '--parallax-y': '0px',
            '--parallax-z': '0px'
        }
    });

    matchUtilities({
        'perspective': value => ({
            '--parallax-perspective': value
        }),
        'parallax-x': value => ({
            'transform': `perspective(var(--parallax-perspective)) translate3d(
                calc(var(--parallax-control) * var(--parallax-x)),
                calc(var(--parallax-control) * var(--parallax-y)),
                calc(var(--parallax-control) * var(--parallax-z))
            )`,
            '--parallax-x': value
        }),
        'parallax-y': value => ({
            'transform': `perspective(var(--parallax-perspective)) translate3d(
                calc(var(--parallax-control) * var(--parallax-x)),
                calc(var(--parallax-control) * var(--parallax-y)),
                calc(var(--parallax-control) * var(--parallax-z))
            )`,
            '--parallax-y': value
        }),
        'parallax-z': value => ({
            'transform': `perspective(var(--parallax-perspective)) translate3d(
                calc(var(--parallax-control) * var(--parallax-x)),
                calc(var(--parallax-control) * var(--parallax-y)),
                calc(var(--parallax-control) * var(--parallax-z))
            )`,
            '--parallax-z': value
        })
    }, {
        values: theme('width')
    });
});
