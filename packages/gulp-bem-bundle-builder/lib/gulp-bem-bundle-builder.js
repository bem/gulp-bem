'use strict';

const assert = require('assert');
const path = require('path');
const util = require('util');
const Readable = require('stream').Readable;

const fs = require('mz/fs');
const _eval = require('node-eval');
const merge = require('merge2');
const gulpBemSrc = require('gulp-bem-src');
const thru = require('through2');
const BemBundle = require('@bem/sdk.bundle');
const File = require('vinyl');

/**
 * @typedef {{
 *   src: function(tech: String, opts: ?Object): Stream<Vinyl>,
 *   target: function(target: String): Stream<Vinyl>
 * }} Builder~Bundle
 */

/**
 * @param {Object} opts - options that also will be passed to src
 * @param {?BemConfig} opts.config - BemConfig instance with project configuration
 * @param {?Array<String>} opts.levels - levels to use by default for builds
 * @returns {function(Object<String, function(bundle: Builder~Bundle): Stream<Vinyl>>): Stream<Vinyl>}
 */
module.exports = function(opts) {
    return function builder(targets) {
        return thru.obj(function(bundle, enc, cb) {
            tryCatch(() =>
                assert(File.isVinyl(bundle) || BemBundle.isBundle(bundle),
                    'Unacceptable object: ' + util.inspect(bundle)),
                (e) => (bundle = cb(e)));

            File.isVinyl(bundle) && (bundle = tryCatch(() => createBundleFromVinyl(bundle), cb));

            if (!bundle) {
                return;
            }

            // Drop after https://github.com/bem-sdk/bem-bundle/issues/7
            bundle.dirname = path.dirname(bundle.path);

            const levels = [].concat(opts.levels)
                .concat(bundle.levels.map(level => path.relative(process.cwd(), level)))
                .filter(Boolean);

            const targetDataBuffer = {};

            const ctx = Object.assign(bundle, {
                src: function(tech, subopts) {
                    return gulpBemSrc(
                        levels,
                        bundle.decl,
                        tech,
                        Object.assign({}, opts, subopts, bundle.srcOpts)
                    ).on('error', cb);
                },
                target: function(target) {
                    const filePath = () => path.join(bundle.dirname, `${bundle.name}.${target}`);

                    // Dynamically create buffer for unknown target to read file
                    const buffer = targetDataBuffer[target] ||
                        (targetDataBuffer[target] =
                            fs.readFile(filePath())
                                .then(contents => [
                                    new File({
                                        base: bundle.dirname,
                                        name: bundle.name,
                                        path: filePath(),
                                        contents
                                    })
                                ]));

                    const out = new Readable({objectMode: true, read() {}});

                    buffer
                        .then(chunks => {
                            chunks.forEach(chunk => out.push(chunk));
                            out.push(null);
                        })
                        .catch(e => out.emit('error', e));

                    return out;
                }
            });

            const res = this;

            merge(Object.keys(targets).map(target => {
                const streamGenerator = targets[target];
                const stream = tryCatch(() => streamGenerator(ctx), cb);

                if (!stream) {
                    return new Readable({objectMode: null, read() {}});
                }

                targetDataBuffer[target] = new Promise(resolve => {
                    const chunks = [];
                    stream
                        .on('data', chunk => {
                            chunk.path = path.join(bundle.dirname, chunk.relative);
                            chunk.base = bundle.dirname;
                            chunks.push(chunk);
                        })
                        .on('error', cb)
                        .on('end', () => resolve(chunks));
                });

                return stream; //.pipe(concat(ctx.name + '.' + target));
            }))
                .on('data', file => res.push(file))
                .on('error', cb)
                .on('end', cb);
        });
    };
};

function createBundleFromVinyl(file) {
    const tech = pathTech(file.path);
    assert(['bemjson.js', 'bemdecl.js'].indexOf(tech) !== -1, `Unacceptable file: ${file.path}`);

    const key = (tech === 'bemjson.js') ? 'bemjson' : 'decl';
    const data = {path: file.path};
    data[key] = _eval(String(file.contents));

    return new BemBundle(data);
}

function pathTech(fullpath) {
    return path.basename(fullpath).split('.').slice(1).join('.');
}

function tryCatch(fn, cb) {
    try {
        return fn();
    } catch(e) {
        cb(e);
    }
}
