import path from 'path';

export default {
    parser: '@babel/eslint-parser',
    parserOptions: {
        sourceType: 'module',
        requireConfigFile: false,
        allowImportExportEverywhere: true,
        ecmaVersion: 'latest',
        ecmaFeatures: {
            impliedStrict: true
        }
    },
    extends: [
        path.resolve(__dirname, 'eslintrc.json')
    ]
};
