'use strict';

const thru = require('through2');
const bemDecl = require('bem-decl');
const BemBundle = require('@bem/bundle');

module.exports = function(opts) {
    opts = Object.assign({
        name: 'merged',
        path: '.'
    }, opts);

    return thru.obj(function(chunk, enc, cb) {
        this.decls || (this.decls = []);
        chunk.decl && this.decls.push(chunk.decl);
        if (opts.mergeLevels) {
            this.levels || (this.levels = []);
            chunk.levels && this.levels.push(chunk.levels);
        }
        cb(null);
    }, function(cb) {
        const decl = bemDecl.merge.apply(null, this.decls);
        const levels = opts.mergeLevels ? [].concat.apply([], this.levels) : [];
        this.push(new BemBundle(Object.assign({}, opts, { decl, levels })));
        cb();
    });
};
