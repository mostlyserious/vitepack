const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const rfgApi = require('rfg-api');
const AdmZip = require('adm-zip');

const __home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const apikeypath = path.join(__home, '.realfavicon');
const rfg = rfgApi.init();
const NAME = 'real-favicon';

let apiKey;

if (process.env.REALFAVICON_KEY) {
    apiKey = process.env.REALFAVICON_KEY;
} else if (fs.existsSync(apikeypath)) {
    apiKey = fs.readFileSync(apikeypath, 'utf8').trim();
}

module.exports = (options = {}) => {
    let config,
        configContext;

    options.cache = path.resolve(options.cache || '.cache/favicon');

    return {
        name: NAME,

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
                config.logger.error(`${NAME}: No API key provided for Real Favicon Generator.`);

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
                            config.logger.error(`${NAME}: ${error.message}`);

                            return;
                        }
                    }

                    return full;
                }, '/');
            }

            try {
                const regex = /\.(xml|html|webmanifest$)$/;

                let entries = await fetchFavicons(options.cache, ident, request);

                entries = entries.map(entry => {
                    if (regex.test(entry.name)) {
                        let data = updatePaths(entry.getData().toString('utf8'), config);

                        entry.setData(Buffer.from(data));
                    }

                    entry.hash = hash(entry.getData(), 8);

                    return entry;
                });

                entries = entries.map(entry => {
                    if (regex.test(entry.name)) {
                        let data = entry.getData().toString('utf8');

                        entries.forEach(item => {
                            const hashed = item.name.replace(
                                /(\.[\w\d_-]+)$/i, `.${item.hash}$1`
                            );

                            data = data.replace(item.name, `${config.build.assetsDir}/${hashed}`);

                            entry.setData(data);
                        });
                    }

                    return entry;
                });

                entries.forEach(entry => {
                    const hashedName = entry.name === 'html_code.html'
                        ? 'markup.html'
                        : entry.name.replace(/(\.[\w\d_-]+)$/i, `.${entry.hash}$1`);
                    const hashedPath = `${config.build.assetsDir}/${hashedName}`;

                    bundler[hashedPath] = {
                        fileName: hashedPath,
                        name: entry.name,
                        source: entry.getData(),
                        type: 'asset'
                    };
                });
            } catch (error) {
                config.logger.error(`${NAME}: ${error.message}`);
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

function updatePaths(data, config) {
    const systemPath = path.resolve(process.cwd(), config.build.outDir);

    return data.replaceAll(systemPath, config.base).replaceAll('//', '/');
}

function hash(content, length = 40) {
    return crypto
        .createHash('sha1')
        .update(content)
        .digest('hex')
        .substring(0, length);
}
