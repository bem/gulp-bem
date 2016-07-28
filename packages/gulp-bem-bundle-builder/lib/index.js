'use strict';

const assert = require('assert');
const path = require('path');

const _eval = require('node-eval');
const merge = require('merge2');
const gulpBemSrc = require('gulp-bem-src');
const thru = require('through2');
const BemBundle = require('bem-bundle');
const File = require('vinyl');

/**
 * @param {Object} opts
 * @param {?BemConfig} opts.config
 * @returns {function(targets: String|String[]): Stream<Vinyl>}
 */
module.exports = function(opts) {
    return function builder(targets) {
        return thru.obj(function(bundle, enc, cb) {
            assert(File.isVinyl(bundle) && ~['bemjson.js', 'bemdecl.js'].indexOf(pathTech(bundle.path)) ||
                bundle instanceof BemBundle,
                'Unacceptable object:' + bundle);

            try {
                File.isVinyl(bundle) && (bundle = createBundleFromVinyl(bundle));
            } catch(e) {
                cb(e);
                return;
            }

            bundle.dirname = path.dirname(bundle.path);

            const levels = [].concat(opts.levels)
                .concat(bundle.levels.map(level => path.relative(process.cwd(), path.join(bundle.dirname, level))))
                .filter(Boolean);

            const ctx = Object.assign(bundle, {
                src: function(tech) {
                    return gulpBemSrc(
                        levels,
                        bundle.decl,
                        tech,
                        opts
                    ).on('error', cb);
                },
                target: function(tech) {
                    // later... provide stream of a target on resolve
                }
            });

            var res = this;

            merge(Object.keys(targets).map(target => {
                const streamGenerator = targets[target];
                const stream = streamGenerator(ctx);
                stream.on('data', chunk => {
                    const dirname = path.dirname(bundle.path);
                    chunk.path = path.join(dirname, chunk.relative);
                    chunk.base = dirname;
                });
                stream.on('error', cb);
                // later... resolve targets for ctx.target
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
