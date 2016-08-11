'use strict';

const fs = require('mz/fs');
const path = require('path');
const Readable = require('stream').Readable;

const globby = require('globby');
const nodeEval = require('node-eval');
const decl = require('bem-decl');
const BemBundle = require('bem-bundle');

module.exports = function(pattern, opts) {
    opts = Object.assign({
        // RE matching for 'blocks', 'common.blocks', 'anything-else.blocks',
        // but not 'vodka.putin.blocks', 'bala/laika.blocks'.
        levelPattern: /([^\/\.]+\.|^)blocks$/,
        declVersion: 'v2'
    }, opts);

    const _declNormalize = decl.normalizer(opts.declVersion);
    let declNormalize = _declNormalize;
    if (opts.declVersion === 'v2') {
        declNormalize = data => _declNormalize(data).map(e => (e.entity.tech = e.tech, e.entity));
    }

    const output = new Readable({
        objectMode: true,
        read: function() {}
    });

    globby(pattern, opts)
        // Skip entities started with `.`
        .then(matches => matches.filter(dirname => path.basename(dirname).charAt(0) !== '.'))
        .then(dirnames => Promise.all(dirnames.map(dirname => {
            return fs.readdir(dirname)
                .then(filenames => Promise.all(filenames.map(filename => {
                    const filepath = path.join(dirname, filename);
                    return fs.stat(filepath)
                        .then(stats => ({
                            path: filepath,
                            basename: filename,
                            name: pathName(dirname),
                            tech: pathTech(filename),
                            isDirectory: stats.isDirectory(),
                            isFile: stats.isFile()
                        }));
                })))
                .then(files => ({dirname, files}));
        })))
        .then(bundles => Promise.all(bundles.map(bundle => {
            bundle = Object.assign({
                name: path.basename(bundle.dirname),
                path: bundle.dirname + path.sep + '.',
                levels: []
            }, bundle);

            const subLevels = bundle.files.filter(f => f.isDirectory && ~f.path.search(opts.levelPattern));

            const bemjsonFilename = _pathToBestMatched(bundle, 'bemjson.js');
            const bemdeclFilename = _pathToBestMatched(bundle, 'bemdecl.js');

            if (subLevels.length) {
                bundle.levels.concat(subLevels.map(file => file.path));
            }

            return Promise
                .all([
                    bemdeclFilename && fs.readFile(bemdeclFilename, 'utf8'),
                    bemjsonFilename && fs.readFile(bemjsonFilename, 'utf8')
                ])
                .then(res => {
                    const decl = res[0];
                    const bemjson = res[1];
                    decl && (bundle.decl = declNormalize(nodeEval(decl)));
                    bemjson && (bundle.bemjson = nodeEval(bemjson));
                })
                .then(() => new BemBundle(bundle))
        })))
        .then(bundle => output.push(bundle))
        .catch(err => {
            console.error(err.stack);
            output.emit(err)
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
