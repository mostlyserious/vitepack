import fs from 'fs';
import path from 'path';
import axios from 'axios';
import https from 'https';
import crypto from 'crypto';
import rfgApi from 'rfg-api';
import AdmZip from 'adm-zip';

const __home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const apikeypath = path.join(__home, '.realfavicon');
const rfg = rfgApi.init();

let apiKey;

if (process.env.REALFAVICON_KEY) {
    apiKey = process.env.REALFAVICON_KEY;
} else if (fs.existsSync(apikeypath)) {
    apiKey = fs.readFileSync(apikeypath, 'utf8').trim();
}

export default (options = {}) => {
    let config,
        configContext;

    options.cache = path.resolve(options.cache || '.cache/favicon');

    return {
        name: 'vite-plugin-real-favicon',

        configResolved(resolvedConfig) {
            config = resolvedConfig;
            configContext = path.dirname(path.resolve(options.input));
        },

        async generateBundle(_, bundler) {
            const content = fs.readFileSync(path.resolve(options.input), 'utf8');
            const args = normalizeRequest(content, configContext);

            let request,
                ident;

            args.apiKey = apiKey;
            args.iconsPath = path.resolve(config.build.outDir);

            if (!args.apiKey) {
                config.logger.error('vite-plugin-real-favicon: No API key provided for Real Favicon Generator.');

                return;
            }

            request = rfg.createRequest(args);
            ident = hash(JSON.stringify(request));

            if (!fs.existsSync(options.cache)) {
                options.cache.split(path.sep).reduce((current, next) => {
                    const full = path.resolve(current, next);

                    try {
                        if (full !== '/') {
                            fs.mkdirSync(full);
                        }
                    } catch (error) {
                        if (error.code !== 'EEXIST') {
                            config.logger.error(`vite-plugin-tinify: ${error.message}`);

                            return;
                        }
                    }

                    return full;
                }, '/');
            }

            try {
                let entries = await fetchFavicons(options.cache, ident, request);

                entries = entries.forEach(entry => {
                    const hashedName = entry.name !== 'html_code.html'
                        ? entry.name.replace(/(\.[\w\d_-]+)$/i, `.${hash(entry.toString('utf8'), 8)}$1`)
                        : 'markup.html';
                    const hashedPath = `${config.build.assetsDir}/${hashedName}`;

                    if (entry.name === 'html_code.html') {
                        let data = entry.getData().toString('utf8')
                            .replaceAll(path.resolve(process.cwd(), config.build.outDir), config.base)
                            .replaceAll('//', '/');

                        entries.forEach(item => {
                            const hashed = item.name.replace(
                                /(\.[\w\d_-]+)$/i,
                                `.${hash(item.toString('utf8'), 8)}$1`
                            );

                            data = data.replace(item.name, `${config.build.assetsDir}/${hashed}`);
                        });

                        bundler[hashedPath] = {
                            fileName: hashedPath,
                            name: 'markup.html',
                            source: Buffer.from(data),
                            type: 'asset'
                        };
                    } else {
                        bundler[hashedPath] = {
                            fileName: hashedPath,
                            name: entry.name,
                            source: entry.getData(),
                            type: 'asset'
                        };
                    }
                });
            } catch (error) {
                config.logger.error(`vite-plugin-tinify: ${error.message}`);
            }
        }
    };
};

function fetchFavicons(cache, ident, request) {
    const checksumfile = path.join(cache, ident);

    return new Promise((resolve, reject) => {
        if (fs.existsSync(checksumfile)) {
            resolve(unpackFavicons(fs.createReadStream(checksumfile), cache, ident));
        } else {
            axios.post('https://realfavicongenerator.net/api/favicon', {
                'favicon_generation': request
            }).then(res => {
                https.get(res.data.favicon_generation_result.favicon.package_url, res => {
                    resolve(unpackFavicons(res, cache, ident));
                });
            }).catch(error => {
                let err = (error
                    && error.data
                    && error.data.favicon_generation_result
                    && error.data.favicon_generation_result.result
                    && error.data.favicon_generation_result.result.error_message)
                    ? error.data.favicon_generation_result.result.error_message
                    : error;

                reject(new Promise((resolve, reject) => reject(err)));
            });
        }
    });
}

function unpackFavicons(res, cache, ident) {
    let data = [],
        size = 0,
        pos = 0;

    return new Promise((resolve, reject) => {
        res.on('data', chunk => {
            data.push(chunk);
            size += chunk.length;
        }).on('end', () => {
            const buffer = Buffer.alloc(size);

            data.forEach(chunk => {
                chunk.copy(buffer, pos);
                pos += chunk.length;
            });

            const checksumfile = path.join(cache, ident);
            const zip = new AdmZip(buffer);

            if (!fs.existsSync(checksumfile)) {
                fs.writeFile(checksumfile, buffer, err => err && console.log(err));
            }

            resolve(zip.getEntries());
        });
    });
}

function normalizeRequest(json, configContext) {
    const config = JSON.parse(json);

    config.masterPicture = normalizeMasterPicture(config.masterPicture, configContext);
    config.design = normalizeDesignMasterPictures(config.design, configContext);

    return config;
}

function normalizeMasterPicture(source, configContext) {
    if (source.constructor === Object) {
        return source;
    }

    if (rfg.isUrl(source)) {
        return {
            type: 'url',
            content: source
        };
    }

    if (rfg.isBase64(source)) {
        return {
            type: 'inline',
            content: source
        };
    }

    return {
        type: 'inline',
        content: rfg.fileToBase64Sync(path.resolve(configContext, source))
    };
}

function normalizeDesignMasterPictures(design, configContext) {
    if (design.constructor === Array && design.length) {
        for (let i = 0; i < design.length; i++) {
            design[i] = normalizeDesignMasterPictures(design[i], configContext);
        }

        return design;
    } else if (design.constructor === Object && Object.keys(design).length) {
        let keys = Object.keys(design);

        for (let j = 0; j < keys.length; j++) {
            if (keys[j] === 'masterPicture') {
                design[keys[j]] = normalizeMasterPicture(design[keys[j]], configContext);
            } else {
                design[keys[j]] = normalizeDesignMasterPictures(design[keys[j]], configContext);
            }
        }

        return design;
    }

    return design;
}

function hash(content, length = 40) {
    return crypto
        .createHash('sha1')
        .update(content)
        .digest('hex')
        .substring(0, length);
}
