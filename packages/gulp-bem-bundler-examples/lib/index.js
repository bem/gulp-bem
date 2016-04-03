'use strict';

const fs = require('fs');
const path = require('path');
const through2 = require('through2');

module.exports = (levels) => {
    levels = levels || [];

    var bundles = {};
    
    function getBlockName(vinyl) {
        return path.basename(vinyl.path).split('.')[0];
    }

    function isBemjsonFile(name) {
        return name.match(/\.bemjson\.js/);
    }

    function isNotBemjsonFile(name) {
        return !isBemjsonFile(name);
    }

    function resolveAbsolutePath(vinylPath, fileName) {
        return path.join(vinylPath, fileName);
    }

    return through2.obj((vinyl, enc, callback) => {
        const blockName = getBlockName(vinyl);

        fs.readdir(vinyl.path, (error, entries) => {
            if(error) {
                callback(error);
            }

            console.log(vinyl.path);
            callback(null, vinyl.path);

            // const bundle = bundles[blockName] || {bemjson: null, levels};
            //
            // bundle.bemjson = entries
            //     .filter(isBemjsonFile)
            //     .map(resolveAbsolutePath.bind(null, vinyl.path))[0];
            //
            // bundle.levels = bundle.levels.concat(entries
            //     .filter(isNotBemjsonFile)
            //     .map(resolveAbsolutePath.bind(null, vinyl.path)));
            //
            // bundles[ blockName ] = bundle;
            // console.log(bundle);
            // callback(null, bundle);
        });
    }, callback => {
        console.log('flush');
        console.log(bundles);
    });
};
