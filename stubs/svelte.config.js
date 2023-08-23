import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    vitePlugin: { emitCss: false },
    preprocess: [ preprocess({
        typescript: true,
        postcss: true
    }) ]
};

export default config;
