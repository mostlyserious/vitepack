#!/usr/bin/env node

const log = require('./util/log');

const [ cmd ] = process.argv.splice(2);

if (cmd !== 'init') {
    if (cmd) {
        log.error(`Command "${cmd}" not found.`);
    }

    log.info('There\'s really only one command right now… "init".');
    log.info('This will stub out some build configuration files if they do not already exist.');

    process.exit();
}

require(`./${cmd}`);
