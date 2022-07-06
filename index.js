import fs from 'fs';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import tinify from './vite-plugin-tinify';
import viteRestart from 'vite-plugin-restart';
import devManifest from 'vite-plugin-dev-manifest';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const pem = `${__home}/.config/valet/CA/LaravelValetCASelfSigned.pem`;

try {
    (env => Object.keys(env).forEach(key => {
        process.env[key] = env[key].replace(/\$\{(.+)\}/gi, (original, a) => env[a]);
    }))(dotenv.config().parsed);
} catch (error) {
    console.warn('No .env file');
}

export default (args = {}, handler) => {
    return handler(defineConfig({
        plugins: [
            viteRestart({
                restart: args.watch
                    ? args.watch
                    : []
            }),
            devManifest(),
            tinify(),
            svelte()
        ],
        base: args.base,
        publicDir: args.static
            ? args.static
            : false,
        build: {
            manifest: true,
            outDir: args.outDir
        },
        server: {
            host: process.env.APP_HOST ? process.env.APP_HOST : 'localhost',
            https: args.https ? args.https : (process.env.APP_URL.includes('https:') && fs.existsSync(pem) ? {
                key: fs.readFileSync(`${__home}/.config/valet/Certificates/${process.env.APP_HOST}.key`),
                cert: fs.readFileSync(`${__home}/.config/valet/Certificates/${process.env.APP_HOST}.crt`),
                ca: fs.readFileSync(pem)
            } : false)
        },
        resolve: {
            extensions: [ '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte' ]
        }
    }));
};
