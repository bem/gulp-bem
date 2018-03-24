'use strict';

module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 6
    },
    env: {
        node: true,
        es6: true
    },
    extends: 'pedant',

    overrides: [
        {
            files: ['*.test.js'],
            env: { mocha: true },
            rules: {
                'no-unused-expressions': 0
            }
        }
    ]
};
