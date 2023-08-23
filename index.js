import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import svgo from 'vite-svg-loader';
import { defineConfig } from 'vite';
import tinify from './plugin/tinify.js';
import dotenvExpand from 'dotenv-expand';
import eslint from 'vite-plugin-eslint';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import devManifest from 'vite-plugin-dev-manifest/dist/index.mjs';

const __home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const pem = `${__home}/.config/valet/CA/LaravelValetCASelfSigned.pem`;
const certDir = `${__home}/.config/valet/Certificates`;

try {
    dotenvExpand.expand(dotenv.config());
} catch (error) {
    console.warn('No .env file');
}

export default (args = {}, handler) => {
    const VITEPACK_HOST = process.env.VITEPACK_HOST || process.env.APP_HOST;
    const VITEPACK_URL = process.env.VITEPACK_URL || process.env.APP_URL;

    return handler(defineConfig({
        base: args.base,
        publicDir: (args.static ? args.static : false),
        build: {
            manifest: true,
            outDir: args.outDir,
            assetsInlineLimit: 0
        },
        plugins: [
            svgo({ defaultImport: 'url' }),
            devManifest(),
            eslint(),
            tinify(),
            svelte()
        ],
        server: {
            host: (VITEPACK_HOST ? VITEPACK_HOST : 'localhost'),
            https: args.https !== undefined ? args.https : (VITEPACK_URL && VITEPACK_URL.includes('https:') && fs.existsSync(pem) ? {
                key: fs.readFileSync(`${certDir}/${VITEPACK_HOST}.key`),
                cert: fs.readFileSync(`${certDir}/${VITEPACK_HOST}.crt`),
                ca: fs.readFileSync(pem)
            } : false)
        },
        resolve: {
            extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte' ],
            alias: { '@': path.resolve(process.cwd(), 'src') }
        }
    }));
};
