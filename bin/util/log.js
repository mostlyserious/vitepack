const pc = require('picocolors');

const warn = pc.yellow('warn');
const error = pc.red('error');
const info = pc.blue('info');

module.exports = {
    info: msg => console.log(`${info} ${msg}`),
    warn: msg => console.warn(`${warn} ${msg}`),
    error: msg => console.error(`${error} ${msg}`)
};
