'use strict';

const assert = require('assert');
const { execSync } = require('child_process');

const bundler = require('..');

describe('gulp-bem-bundler-fs', () => {
    let bundles;
    before(async () => {
        console.log('FS:');
        console.log(execSync('tree ' + __dirname + '/fixtures/bundles') + '');

        bundles = await toArray(bundler(__dirname + '/fixtures/bundles/*', { levels: ['blocks'] }));
    });

    it('should create bundles', () => {
        // Should create 2 bundles:
        //  page: { levels: ['blocks'], bemsjson: 'page.bemjson.js' }
        //  bundle: { decl: 'bundle.bemdecl.js' }
        assert.equal(bundles.length, 2, '2 bundles');
    });

    it('should find `bundle` with no levels, etc...', () => {
        const bundle = bundles.find(b => b.name === 'bundle');
        assert(bundle, 'Should find bundle with name `bundle`');

        assert.equal(bundle.levels.length, 0, 'levels');
    });

    it('should find `page` bundle with no levels, etc...', () => {
        const page = bundles.find(b => b.name === 'page');
        assert(page, 'Should find bundle with name `bundle`');

        assert.equal(page.levels.length, 1, 'levels');
    });
});

function toArray(stream) {
    return new Promise((resolve, reject) => {
        const res = [];
        stream
            .on('data', (data) => res.push(data))
            .on('end', () => resolve(res))
            .on('error', (err) => reject(err));
    });
}
