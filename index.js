var fs = require('fs');
var path = require('path');

var through = require('through2');
var sort = require('sort-stream2')

var walk = require('bem-walk');
var bemDeps = require('@bem/deps');
var toArray = require('stream-to-array');
var vfs = require('vinyl-fs');
var File = require('vinyl');

var bemjsonToBemEntity = require('./bemjson2bemEntity');
var bemdeclToBemEntity = require('./bemdecl2bemEntity');

//var DUMP = through.obj(function(file, enc, cb) {
//    debugger;
//    //console.log(file);
//    cb(null, file);
//});

function BEMProject(opts) {
    this.levelsConfig = opts.bemconfig || {};
    var levels = Object.keys(this.levelsConfig);
    this.levels = levels;

    this.introspection = walk(levels, {levels: this.levelsConfig})
        .pipe(sort(function(a, b) {
            return levels.indexOf(a.level) -
                levels.indexOf(b.level);
        }));
}

BEMProject.prototype.bundle = function (opts) {
    opts || (opts = {});

    // if (opts.levels && (
    //     opts.levels.length !== this.levels.length ||
    //     opts.levels !== this.levels // <----------- TODO <----------
    // )) {
    //     opts.introspection = this.introspection.then(function(levels) {
    //         // filtrrrrr <----------- TODO <------------
    //         return levels;
    //     });
    // } else {

    // TODO: Levels of bundle are subset of project levels 

    opts.levels || (opts.levels = this.levels);
    opts.project = this;

    return new BEMBundle(opts);
};

/**
 * map bem-deps by bem-walk-entities
 * @param  {Array} decl        – bem-deps [{ block, elem, modName, modVal }, ...]
 * @param  {Array} fsEntities  – bem-walk [{ entity: { block, elem, modName, modVal }, tech }, ...]
 * @param  {String[]} tech     - tech name: 'js' || 'css' || 'bemhtml' || ...
 * @param  {Function} cb       - callback with filtred decls with files
 */
function filterDeps(decl, fsEntities, extensions, cb) {
    var entitiesWithTech = [];

    decl.forEach(function(entity) {
        var ewt = fsEntities.filter(function(file) {
            if(extensions.indexOf('.' + file.tech) === -1) return;
            if(file.entity.block !== entity.block) return;
            if(file.entity.elem !== entity.elem) return;
            if(file.entity.modName !== entity.modName) return;
            // True modifiers are truly outrageous.
            if(file.entity.modVal === true && !entity.hasOwnProperty('modVal')) return true;
            if(entity.modVal === true && !file.entity.hasOwnProperty('modVal')) return true;

            if(file.entity.modVal !== entity.modVal) return;
            return true;
        });

        entitiesWithTech = [].concat(entitiesWithTech, ewt);
    });

    cb(null, entitiesWithTech);
}

/**
 * BEMBundle
 * @param {Object} opts
 * @param {?String} opts.name
 * @param {String} opts.path
 * @param {String} opts.decl
 * @param {String[]} opts.levels
 * @param {Promise<FileEntity[]>} opts.introspection
 */
function BEMBundle(opts) {
    opts = opts || {};

    // todo: make it asserts
    if (!opts.path) throw new Error('Bundle requires `path` property');
    if (!opts.decl) throw new Error('Bundle requires `decl` property with bemjson.js or bemdecl.js file');
    if (!opts.levels || !Array.isArray(opts.levels)) throw new Error('`levels` property should be an array');

    this._name = opts.name || path.basename(opts.path);
    this._path = opts.path;
    this._decl = path.resolve(opts.path, opts.decl);
    this._levels = opts.levels;
    this._project = opts.project;

    var declStream = vfs.src(this._decl);

    if (this._decl.endsWith('.bemjson.js')) {
        this._entities = declStream.pipe(bemjsonToBemEntity());
        this._bemjson = declStream.pipe(through.obj());
    } else {
        this._entities = declStream.pipe(bemdeclToBemEntity());
    }

    //TODO: take it from introspect
    this._deps = bemDeps.load({levels: this._levels});

    //TODO: how to clone this streams?
    this._entities = toArray(this._entities);
    this._deps = toArray(this._deps);
    this._introspection = toArray(this._project.introspection);
}

BEMBundle.prototype.entities = function() {
    return this._entities;
};

BEMBundle.prototype.bemjson = function() {
    return this._bemjson.pipe(through.obj(function(file, enc, cb) {
        cb(null, file.clone());
    }));
};

BEMBundle.prototype.src = function(opts) {
    if (!opts.tech) throw new Error('Tech is required');

    var extensions = opts.extensions || [opts.tech];
    var stream = through.obj();

    Promise.all([
      this.entities(),
      this._deps,
      this._introspection
    ])
    .then(function(res) {
        var deps = bemDeps.resolve(res[0], res[1]);

        filterDeps(deps.entities, res[2], extensions, function(err, sourceFiles) {
            if (err) {
                stream.emit('error', err)
                return stream.push(null);
            }

            var que = {};
            var length = sourceFiles.length;
            length || stream.push(null);
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

BEMBundle.prototype.name = function () {
    return this._name;
};

BEMBundle.prototype.path = function () {
    return this._path;
};

module.exports = function (opts) {
    return new BEMProject(opts);
};
