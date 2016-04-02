'use strict';

const fs = require('fs');

const through = require('through2');
const sort = require('sort-stream2')

const walk = require('bem-walk');
const bemDeps = require('@bem/deps');
const toArray = require('stream-to-array');
const File = require('vinyl');

/**
 * map bem-deps by bem-walk-entities
 * @param  {Array} decl          – bem-deps [{ block, elem, modName, modVal }, ...]
 * @param  {Array} fsEntities    – bem-walk [{ entity: { block, elem, modName, modVal }, tech }, ...]
 * @param  {String[]} extensions - tech name: 'js' || 'css' || 'bemhtml' || ...
 * @param  {Function} cb         - callback with filtred decls with files
 */
function filterDeps(decl, fsEntities, extensions, cb) {
    var entitiesWithTech = [];

    decl.forEach(entity => {
        var ewt = fsEntities.filter(function(file) {
            if(extensions.indexOf('.' + file.tech) === -1) { return false; }
            if(file.entity.block !== entity.block) { return false; }
            if(file.entity.elem !== entity.elem) { return false; }
            if(file.entity.modName !== entity.modName) { return false; }
            // True modifiers are truly outrageous.
            if(file.entity.modVal === true && !entity.hasOwnProperty('modVal')) { return true; }
            if(entity.modVal === true && !file.entity.hasOwnProperty('modVal')) { return true; }

            if(file.entity.modVal !== entity.modVal) { return false; }
            return true;
        });

        entitiesWithTech = [].concat(entitiesWithTech, ewt);
    });

    cb(null, entitiesWithTech);
}

module.exports = function src(opts) {
    // todo: make it asserts
    if (!opts.levels || !Array.isArray(opts.levels)) {
        throw new Error('`levels` property should be an array');
    }
    if (!opts.tech) {
        throw new Error('Tech is required');
    }

    opts || (opts = {});

    var levels = opts.levels || [];
    var decl = opts.decl || [];
    var extensions = opts.extensions || [opts.tech];
    //TODO: take it from introspect
    var deps = toArray(bemDeps.load({ levels: levels }));
    var introspection = toArray(walk(levels, { levels: opts.config })
        .pipe(sort(function(a, b) {
            return levels.indexOf(a.level) - levels.indexOf(b.level);
        })));

    var stream = through.obj();

    Promise.all([
        deps,
        introspection
    ])
    .then(function(res) {
        var relations = res[0];
        var fsEntities = res[1];
        var resolvedDecl = bemDeps.resolve(decl, relations);

        filterDeps(resolvedDecl.entities, fsEntities, extensions, function(err, sourceFiles) {
            if (err) {
                stream.emit('error', err)
                return stream.push(null);
            }

            var que = {};
            var length = sourceFiles.length;
            if (!length) {
                stream.push(new File({path: extensions[0], contents: new Buffer('')}));
                stream.push(null);
            }
            // push files to stream in same order they come
            function pushFilesFromQue() {
                for (var j = 0; j <= length; j++) {
                    var file = que[j];
                    if (!file) { continue; }
                    if (!file.contents) { break; }
                    stream.push(file);
                    que[j] = undefined;
                }
                if (j > length) { stream.push(null); }
            }
            sourceFiles.forEach(function(source, i) {
                var file = new File({path: source.path});
                que[i] = file;
                fs.readFile(source.path, function(err, content) {
                    file.contents = content;
                    pushFilesFromQue(sourceFiles.length);
                });
            });
        });
    })
    .catch(function(err) {
        stream.emit('error', err)
        stream.push(null);
    });

    return stream;
};
