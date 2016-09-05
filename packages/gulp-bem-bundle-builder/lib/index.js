'use strict';

const assert = require('assert');
const path = require('path');

const fs = require('mz/fs');
const _eval = require('node-eval');
const merge = require('merge2');
const gulpBemSrc = require('gulp-bem-src');
const thru = require('through2');
const BemBundle = require('bem-bundle');
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
            assert(File.isVinyl(bundle) && ~['bemjson.js', 'bemdecl.js'].indexOf(pathTech(bundle.path)) ||
                BemBundle.isBundle(bundle),
                'Unacceptable object:' + bundle);

            try {
                File.isVinyl(bundle) && (bundle = createBundleFromVinyl(bundle));
            } catch(e) {
                cb(e);
                return;
            }

            // Drop after https://github.com/bem-sdk/bem-bundle/issues/7
            bundle.dirname = path.dirname(bundle.path);

            const levels = [].concat(opts.levels)
                .concat(bundle.levels.map(level => path.relative(process.cwd(), path.join(bundle.dirname, level))))
                .filter(Boolean);

            const targetDataBuffer = {};

            const ctx = Object.assign(bundle, {
                src: function(tech, subopts) {
                    return gulpBemSrc(
                        levels,
                        bundle.decl,
                        tech,
                        Object.assign({}, opts, subopts)
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

                    const out = thru.obj();

                    buffer
                        .then(chunks => {
                            chunks.forEach(chunk => out.push(chunk));
                            out.push(null);
                        })
                        .catch(e => {
                            out.emit('error', e);
                            out.push(null);
                        });

                    return out;
                }
            });

            const res = this;

            merge(Object.keys(targets).map(target => {
                const streamGenerator = targets[target];
                const stream = streamGenerator(ctx);

                targetDataBuffer[target] = new Promise((resolve, reject) => {
                    const chunks = [];
                    stream
                        .on('data', chunk => {
                            chunk.path = path.join(bundle.dirname, chunk.relative);
                            chunk.base = bundle.dirname;
                            chunks.push(chunk);
                        })
                        .on('error', e => {
                            reject(e);
                            cb(e);
                        })
                        .on('end', () => resolve(chunks));
                });

                return stream; //.pipe(concat(ctx.name + '.' + target));
            }))
                .on('data', function(file) {
                    res.push(file);
                })
                .on('error', cb)
                .on('end', cb);
        });
    };
};

function createBundleFromVinyl(file) {
    const key = (pathTech(file.path) === 'bemjson.js') ? 'bemjson' : 'decl';
    const data = {path: file.path};
    data[key] = _eval(String(file.contents));
    // Should we read internal levels?
    return new BemBundle(data);
}

function pathTech(fullpath) {
    return path.basename(fullpath).split('.').slice(1).join('.');
}
