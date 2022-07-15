const pc = require('picocolors');
const { resolve, relative } = require('node:path');
const { copyFile, constants } = require('node:fs');

const [ arg ] = process.argv.splice(2);
const warn = pc.yellow(`warn`);
const error = pc.red(`error`);
const info = pc.blue(`info`);

if (arg !== 'publish') {
    console.error(`${error} Command "${arg}" not found.`);
    console.log(`${info} There's really only one command right now… "publish".`);
    console.log(`${info} This will stub out some build configuration files if they do not already exist.`);

    process.exit();
}

const files = [
    '.browserslistrc',
    '.env',
    '.eslintrc.js',
    'babel.config.js',
    'postcss.config.js',
    'svelte.config.js',
    'tailwind.config.js',
    'vite.config.js'
];

const paths = files.map(filename => {
    return [ resolve(__dirname, `../stubs/${filename}`), resolve(process.cwd(), filename) ];
});

for (const [ src, dest ] of paths) {
    const file = pc.green(relative(process.cwd(), dest));

    copyFile(src, dest, constants.COPYFILE_EXCL, error => {
        if (error) {
            return console.warn(`${warn} ${file} already exists.`);
        }

        console.log(`${info} ${file} added to project.`);
    });
}
