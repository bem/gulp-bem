'use strict';

const path = require('path');

const test = require('ava');
const bemjsonToDecl = require('bemjson-to-decl').convert;
const bemDecl = require('bem-decl');
const bemDeclConvert = require('bem-decl/lib/convert');
const toArray = require('stream-to-array');
const Vinyl = require('vinyl');

const src = require('../index');

const fixturesDir = path.join(__dirname, 'fixtures');
const projectStubDir = path.join(fixturesDir, 'node_modules', 'bem-project-stub');
const bundleName = 'index';
const bundleDir = path.join(projectStubDir, 'desktop.bundles', 'index');
const bemjsonPath = path.join(bundleDir, `${bundleName}.bemjson.js`);
const bemjson = require(bemjsonPath);
const decl = bemDeclConvert(bemDecl.normalize(bemjsonToDecl(bemjson)), { format: 'enb' });
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

const jsFiles = require(`${fixturesDir}/project-stub-files`).js.map(file => new Vinyl(file));

test('should scan `project-stub`', async t => {
    const stream = src({
        levels, decl,
        tech: 'js',
        extensions: ['.vanilla.js', '.browser.js', '.js'],
        root: projectStubDir,
        cache: false
    });

    const files = await toArray(stream);

    t.deepEqual(files, jsFiles);
});
