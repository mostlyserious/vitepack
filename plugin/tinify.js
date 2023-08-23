import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import tinify from 'tinify';

const __home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const apikeypath = path.join(__home, '.tinypng');
const NAME = 'tinify';

export default (options = {}) => {
    const regex = /\.(png|jpe?g)$/;

    let config,
        apikey,
        outputPath;

    options.cache = path.resolve(options.cache || 'node_modules/.vite/tinify');

    return {
        name: NAME,

        configResolved(resolvedConfig) {
            config = resolvedConfig;
            outputPath = config.build.outDir;
        },

        async generateBundle(_, bundler) {
            const files = [];

            Object.keys(bundler).forEach(key => {
                if (regex.test(path.resolve(outputPath, key))) {
                    files.push(key);
                }
            });

            if (!files.length) {
                return;
            }

            const handles = files.map(async filePath => {
                const source = bundler[filePath].source;

                const checksum = crypto.createHash('sha1').update(source.toString('utf8')).digest('hex');
                const checksumfile = path.join(options.cache, checksum);

                let content = source;

                if (fs.existsSync(checksumfile)) {
                    content = fs.readFileSync(checksumfile);
                } else {
                    apikey = options.apikey;

                    if (!apikey) {
                        if (process.env.TINYPNG_KEY) {
                            apikey = process.env.TINYPNG_KEY;
                        } else if (fs.existsSync(apikeypath)) {
                            apikey = fs.readFileSync(apikeypath, 'utf8').trim();
                        }

                        if (!apikey) {
                            config.logger.error(`${NAME}: No API key provided for TinyPNG/TinyJPG. **Images not optimized**`);

                            return;
                        }
                    }

                    if (!fs.existsSync(options.cache)) {
                        options.cache.split(path.sep).reduce((current, next) => {
                            const full = path.resolve(current, next);

                            try {
                                if (full !== '/') {
                                    fs.mkdirSync(full);
                                }
                            } catch (error) {
                                if (error.code !== 'EEXIST') {
                                    config.logger.error(`${NAME}: ${error.message}`);

                                    return;
                                }
                            }

                            return full;
                        }, '/');
                    }

                    tinify.key = apikey;
                    content = await tinify.fromBuffer(content).toBuffer();

                    fs.writeFile(checksumfile, content, err => err && console.log(err));
                }

                if (content) {
                    bundler[filePath].source = content;
                }
            });

            await Promise.all(handles);
        }
    };
};
