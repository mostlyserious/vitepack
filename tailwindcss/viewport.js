const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ addUtilities, variants }) => {
    const bases = {
        'w': [ 'width', 'width' ],
        'h': [ 'height', 'height' ],
        'min-w': [ 'min-width', 'minWidth' ],
        'max-w': [ 'max-width', 'maxWidth' ],
        'min-h': [ 'min-height', 'minHeight' ],
        'max-h': [ 'max-height', 'maxHeight' ]
    };

    const units = [
        'vh', 'vw', 'vmin', 'vmax',
        'svh', 'svw', 'svmin', 'svmax',
        'lvh', 'lvw', 'lvmin', 'lvmax',
        'dvh', 'dvw', 'dvmin', 'dvmax'
    ];

    const viewportSizes = [
        10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100
    ];

    for (const base of Object.keys(bases)) {
        const [ property, variant ] = bases[base];
        const utilities = {};

        for (const unit of units) {
            for (const value of viewportSizes) {
                utilities[`.${base}-${unit}-${value}`] = {
                    [property]: `${value}${unit}`
                };
            }
        }

        addUtilities(utilities, variants(variant));
    }
});
