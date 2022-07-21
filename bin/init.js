const pc = require('picocolors');
const log = require('./util/log');
const { resolve, relative } = require('node:path');
const { copyFile, constants } = require('node:fs');

const files = [
    '.browserslistrc',
    '.env',
    '.eslintrc.js',
    'postcss.config.js',
    'svelte.config.js',
    'tailwind.config.js',
    'vite.config.js'
];

const paths = files.map(filename => [
    resolve(__dirname, `../stubs/${filename}`),
    resolve(process.cwd(), filename)
]);

for (const [ src, dest ] of paths) {
    const file = pc.green(relative(process.cwd(), dest));

    copyFile(src, dest, constants.COPYFILE_EXCL, error => {
        if (error) {
            return log.warn(`${file} already exists.`);
        }

        log.info(`${file} added to project.`);
    });
}
