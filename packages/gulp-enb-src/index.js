require('array-includes').shim();

const assert = require('assert');

const Vinyl = require('vinyl');
const Readable = require('stream').Readable;

const createBundle = require('./lib/bundle').create;
const buildBundle = require('./lib/bundle').build;

module.exports = (options) => {
    const opts = options || {};
    const levels = opts.levels;
    const decl = opts.decl;
    const tech = opts.tech;

    assert(Array.isArray(levels) && levels.length, 'Levels required to get some files');
    assert(Array.isArray(decl) && decl.length, 'Declaration required to harvest some entities');
    assert(tech && typeof tech === 'string', 'Tech required and should be a string to build exactly some');

    const output = new Readable({ objectMode: true, read: () => {} });

    createBundle(opts)
        .then(bundle => buildBundle(bundle, opts))
        .then(files => {
            files.forEach(file => {
                const vinyl = new Vinyl(file);

                output.push(vinyl);
            });

            output.push(null);
        })
        .catch(err => output.emit('error', err));

    return output;
};
