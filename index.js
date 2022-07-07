const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { defineConfig } = require('vite');
const tinify = require('./vite-plugin-tinify');
const { default: svgo } = require('vite-svg-loader');
const { default: eslint } = require('vite-plugin-eslint');
const { default: restart } = require('vite-plugin-restart');
const { default: devManifest } = require('vite-plugin-dev-manifest');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

const __home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const pem = `${__home}/.config/valet/CA/LaravelValetCASelfSigned.pem`;
const certDir = `${__home}/.config/valet/Certificates`;

try {
    const env = dotenv.config().parsed;

    Object.keys(env).forEach(key => {
        process.env[key] = env[key].replace(
            /\$\{(.+)\}/gi, (original, a) => env[a]
        );
    });
} catch (error) {
    console.warn('No .env file');
}

module.exports = (args = {}, handler) => {
    const HOST = process.env.APP_HOST;
    const URL = process.env.APP_URL;

    return handler(defineConfig({
        base: args.base,
        publicDir: (args.static ? args.static : false),
        build: {
            manifest: true,
            outDir: args.outDir
        },
        plugins: [
            restart({ restart: (args.watch ? args.watch : []) }),
            svgo({ defaultImport: 'url' }),
            eslint({ cache: true }),
            devManifest(),
            tinify(),
            svelte()
        ],
        server: {
            host: (HOST ? HOST : 'localhost'),
            https: args.https ? args.https : (URL.includes('https:') && fs.existsSync(pem) ? {
                key: fs.readFileSync(`${certDir}/${HOST}.key`),
                cert: fs.readFileSync(`${certDir}/${HOST}.crt`),
                ca: fs.readFileSync(pem)
            } : false)
        },
        resolve: {
            extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte' ],
            alias: { '@': path.resolve(process.cwd(), 'src') }
        }
    }));
};
