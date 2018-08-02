'use strict';

const thru = require('through2');
const bemDecl = require('@bem/sdk.decl');
const BemBundle = require('@bem/sdk.bundle');

module.exports = function(opts) {
    opts = Object.assign({
        name: 'merged',
        path: '.'
    }, opts);

    const decls = [];
    const mergedLevels = [];
    return thru.obj(
        (chunk, _, cb) => {
            chunk.decl && decls.push(chunk.decl);
            opts.mergeLevels && chunk.levels && mergedLevels.push(chunk.levels);
            cb();
        },
        function(cb) {
            const decl = bemDecl.merge.apply(null, decls);
            const levels = opts.mergeLevels ? [].concat.apply([], mergedLevels) : [];
            this.push(new BemBundle(Object.assign({}, opts, { decl, levels })));
            cb();
        }
    );
};
