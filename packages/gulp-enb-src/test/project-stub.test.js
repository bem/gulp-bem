'use strict';

const path = require('path');

const bemjsonToDecl = require('@bem/sdk.bemjson-to-decl').convert;
// const bemDecl = require('@bem/sdk.decl');
const BemCell = require('@bem/sdk.cell');
// const bemDeclConvert = require('@bem/sdk.decl/lib/formats/enb/normalize');
const toArray = require('stream-to-array');

const assert = require('chai').assert;
const { describe, it } = require('mocha');

const src = require('..');

const fixturesDir = path.join(__dirname, 'fixtures');
const projectStubDir = path.dirname(require.resolve('bem-project-stub/package.json'));
const bundleName = 'index';
const bundleDir = path.join(projectStubDir, 'desktop.bundles', 'index');
const bemjsonPath = path.join(bundleDir, `${bundleName}.bemjson.js`);
const bemjson = require(bemjsonPath);
// console.log({ fixturesDir, projectStubDir });

const decl = bemjsonToDecl(bemjson).map(BemCell.create);
const levels = [
    { path: 'libs/bem-core/common.blocks', check: false },
    { path: 'libs/bem-core/desktop.blocks', check: false },
    { path: 'libs/bem-components/common.blocks', check: false },
    { path: 'libs/bem-components/desktop.blocks', check: false },
    { path: 'libs/bem-components/design/common.blocks', check: false },
    { path: 'libs/bem-components/design/desktop.blocks', check: false },
    'common.blocks',
    'desktop.blocks'
];

const jsPaths = require(`${fixturesDir}/project-stub-files`).js.map(filename => {
    const fullname = path.join(projectStubDir, filename);

    return path.normalize(fullname);
});

describe('gulp-enb-src', () => {
    it('should scan `project-stub`', async () => {
        const stream = src({
            levels,
            decl,
            tech: 'js',
            extensions: ['.vanilla.js', '.browser.js', '.js'],
            root: projectStubDir,
            cache: false
        });

        const files = await toArray(stream);
        const paths = files.map(file => file.path);

        assert.deepEqual(paths, jsPaths);
    });
});
