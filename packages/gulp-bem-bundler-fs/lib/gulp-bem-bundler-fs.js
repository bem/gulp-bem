'use strict';

const assert = require('assert');
const path = require('path');
const { Readable } = require('stream');

const fs = require('mz/fs');
const globby = require('globby');
const nodeEval = require('node-eval');
const sdkDecl = require('@bem/sdk.decl');
const BemBundle = require('@bem/sdk.bundle');

/**
 *
 * @param {string} pattern
 * @param {object} opts
 * @param {string[]} opts.levels        List of additional levels relative to the bundle root folder
 * @param {boolean} opts.preferBemjson
 * @param {object} opts.globbyOptions
 * @returns {module:stream/Readable<BemBundle>}
 */
module.exports = function(pattern, opts = {}) {
    opts = {
        levels: [],
        preferBemjson: false,
        ...opts,
    };

    const output = new Readable({
        objectMode: true,
        read() {}
    });

    (async () => {
        const dirnames = await globby(pattern, {
            // fast-glob opts
            deep: false,
            ...opts.globbyOptions,
            onlyFiles: false,
            onlyDirectories: true,
            stats: false,
        });

        const bundles = await Promise.all(dirnames.map(async (dirname) => {
            const entries = await globby(`${dirname}/*`, {
                onlyFiles: false,
                onlyDirectories: false,
                stats: true
            });

            return {
                dirname,
                files: entries.map(entry => {
                    const basename = path.basename(entry.path);

                    return Object.assign(entry, {
                        basename,
                        name: pathName(basename),
                        tech: pathTech(basename),
                    });
                })
            };
        }));

        await Promise.all(bundles.map(async (bundle) => {
            bundle = Object.assign({
                name: path.basename(bundle.dirname),
                path: bundle.dirname + path.sep + '.',
                levels: opts.levels
                    .map(level => path.join(bundle.dirname, level))
                    // ... filter out unexistent on fs
                    // TODO: add `${bundle.name}.blocks`
                    .filter(level => bundle.files.some(f => f.isFile && path.resolve(f.path) === path.resolve(level)))
            }, bundle);

            const bemjsonFilename = _pathToBestMatched(bundle, 'bemjson.js');
            const bemdeclFilename = _pathToBestMatched(bundle, 'bemdecl.js');

            const [decl, bemjson] = await Promise.all([
                bemdeclFilename && sdkDecl.load(bemdeclFilename),
                bemjsonFilename && fs.readFile(bemjsonFilename, 'utf8')
            ]);

            decl && !opts.preferBemjson && (assert(Array.isArray(decl), `'${bemdeclFilename}' contains invalid data, should be an array`),
                (bundle.decl = decl.map(item => item.entity)));
            bemjson && (bundle.bemjson = nodeEval(bemjson, path.resolve(bemjsonFilename)));

            output.push(new BemBundle(bundle));
        }));

    })()
        .catch(err => {
            console.error(err.stack);
            output.emit(err);
        })
        .then(() => output.push(null));

    return output;
};

function _pathToBestMatched(bundle, tech) {
    const res = bundle.files
        .filter(f => f.isFile && f.tech === tech)
        .sort(f => f.name !== bundle.name);
    return Object(res[0]).path;
}

function pathTech(fullpath) {
    return path.basename(fullpath).split('.').slice(1).join('.');
}

function pathName(fullpath) {
    return path.basename(fullpath).split('.')[0];
}
