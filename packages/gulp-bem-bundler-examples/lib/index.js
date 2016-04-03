'use strict';

const fs = require('fs');
const path = require('path');
const q = require('q');
const through2 = require('through2');

module.exports = function(levels) {
    levels = levels || [];

    var cache = {};

    return through2.obj(function (vinyl, enc, callback) {
        //collect vinyl files
        const blockName = getBlockName(vinyl);

        console.log(vinyl.path);

        readDir(vinyl.path)
            .then(contents => {
                return q.all(contents.map(name => {
                    const filePath = path.join(vinyl.path, name);
                    return isDir(path.join(vinyl.path, name))
                        .then(isDir => ({name, path: filePath, isDir}));
                }))
            })
            .then(entries => {
                const levels = entries
                    .filter(entry => entry.isDir)
                    .map(entry => entry.name);
                const bemjson = entries
                    .reduce((accumulated, entry) => {
                        return entry.indexOf('bemjson') !== -1 ? entry : null;
                    });

                // console.log(levels);
                // console.log(bemjson);
            })
            .then((levels) => {
                callback();
            })
            .catch(err => {
                console.log(err);
                //TODO error handler
            })
            .done();

        // fs.readdir(vinyl.path, (error, contents) => {
        //     var folders = dir.reduce((entry) => {
        //         return entry.isDir
        //     }, []);
        //
        //     let key = buildKey();
        //     if (!cache[key]) {
        //         cache[blockName] = {};
        //     } else {
        //         //???
        //     }

        //    callback();
        });
};

function getBlockName(vinyl) {
    return path.basename(vinyl.path).split('.')[0];
}

function readDir(dirPath) {
    return q.denodeify(fs.readdir)(dirPath);
}

function isDir(dirPath) {
    return q.denodeify(fs.stat)(dirPath)
        .then(stats => stats.isDirectory());
}

var foo = {
    'button1f': {
        'bemjson': 'path/to/bemjson1',
        'levels': ['bem-core/common.blocks', 'common.blocks']
    },
    'button2': {
        'bemjson': 'path/to/bemjson2',
        'levels': ['bem-core/common.blocks', 'common.blocks', 'desktop.blocks']
    }
};

var correct = {
    'button': {

    }
};
