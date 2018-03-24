'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const promisify = require('es6-promisify');
const enb = require('enb');
const mkdirp = promisify(require('mkdirp'));
const writeFile = promisify(fs.writeFile);

const generateConfig = require('./generate-config');
const getConfigDir = require('./config-dir').get;

exports.generateBundleName = (options) => {
    const key = JSON.stringify(options);

    return crypto.createHash('md5')
        .update(key)
        .digest('hex');
};

exports.create = (options) => {
    const opts = options || {};
    const decl = opts.decl;

    assert(Array.isArray(decl) && decl.length, 'Declaration required to create bundle');

    const bundle = { name: exports.generateBundleName(options) };

    return getConfigDir(options)
        .then(configDir => {
            const tmpDir = path.join(configDir, 'tmp');

            bundle.root = path.join(tmpDir, 'enb-src-bundles');
            bundle.path = path.join(bundle.root, bundle.name);

            const tmpConfigDir = path.join(bundle.root, '.enb');

            return Promise.all([
                mkdirp(bundle.path),
                mkdirp(tmpConfigDir)
            ]);
        })
        .then(() => {
            const declPath = path.join(bundle.path, `${bundle.name}.bemdecl.js`);

            return writeFile(declPath, `exports.deps = ${JSON.stringify(decl)};`);
        })
        .then(() => bundle);
};

exports.build = (bundle, options) => {
    const levels = options.levels.map(level => {
        const levelPath = level.path || level;

        return {
            path: path.resolve(options.root, levelPath),
            check: level.hasOwnProperty('check') ? level.check : true
        };
    });
    const extensions = options.extensions || [`.${options.tech}`];
    const suffixes = extensions.map(ext => ext.substr(1));
    const needCache = options.hasOwnProperty('cache') ? options.cache : true;
    const config = generateConfig({
        bundleName: bundle.name,
        levels, suffixes
    });

    return enb.make([], { config, dir: bundle.root, cache: needCache })
        .then(() => {
            const vynilPath = path.join(bundle.path, `${bundle.name}.vinyl.js`);

            return require(vynilPath);
        });
};
