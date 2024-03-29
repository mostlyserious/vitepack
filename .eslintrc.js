import path from 'path';

export default {
    parser: '@babel/eslint-parser',
    parserOptions: {
        sourceType: 'module',
        requireConfigFile: false,
        allowImportExportEverywhere: true,
        ecmaVersion: 12,
        ecmaFeatures: {
            impliedStrict: true
        }
    },
    extends: [
        path.resolve(__dirname, 'eslintrc.json')
    ].filter(Boolean),
    plugins: [
        'svelte3',
        'html'
    ],
    settings: {
        'html/indent': '+4',
        'html/html-extensions': [ '.html', '.php' ],
        'svelte3/ignore-styles': () => true
    },
    overrides: [
        {
            files: [ '**/*.svelte', '**/*.svlt' ],
            processor: 'svelte3/svelte3',
            rules: {
                'one-var': 0,
                'no-multiple-empty-lines': 0
            }
        }
    ]
};
