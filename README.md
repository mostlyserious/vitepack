# Vitepack

## Default `vite.config.js`
```js
import vitepack from '@mostlyserious/vitepack';
// import realFavicon from '@mostlyserious/vitepack/plugin/real-favicon';

const args = {
    base: '/static/',
    outDir: 'web/static'
};

export default vitepack(args, config => {
    config.build.rollupOptions = {
        input: [
            'src/js/main.js',
            'src/js/cp.js'
        ]
    };

    config.resolve.alias['@icons'] = '/web/icons';

    // config.plugins.unshift(realFavicon({
    //     input: 'src/favicon/config.json'
    // }));

    return config;
});
```
