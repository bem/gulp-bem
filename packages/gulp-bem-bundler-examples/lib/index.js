'use strict';

const q = require('q'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    through2 = require('through2'),
    utils = require('./utils'),
    Vinyl = require('vinyl');

module.exports = (levels) => {
    levels = levels || [];

    let cachedBundles = {};

    return through2.obj((vinyl, enc, callback) => {
        const blockName = utils.getBlockName(vinyl);

        readExampleDir(vinyl)
            .then(contents => {
                return groupExampleContents(contents);
            })
            .then(result => {
                const bundles = _(result)
                    .map(groupToBundle)
                    .compact()
                    .value();

                let accumulated = cachedBundles[blockName] || {};

                bundles.forEach(bundle => {
                    let prevBundle = accumulated[bundle.bemjson];

                    if (prevBundle) {
                        prevBundle.levels = _.union(prevBundle.levels, bundle.levels);
                    } else {
                        accumulated[bundle.bemjson] = bundle;
                    }

                    cachedBundles[blockName] = accumulated;
                });


                callback();
            })
            .done();

    }, function(callback)  {
        console.log('flush');
        console.log(convertToStreamData(cachedBundles, levels));
        this.push(convertToStreamData(cachedBundles, levels));
        callback();
    });
};

function readExampleDir(vinyl) {
    return q.denodeify(fs.readdir)(vinyl.path);
}

function groupExampleContents(dirContents) {
    return _.groupBy(dirContents, entry => {
        return entry.split('.')[0];
    });
}

function groupToBundle(group) {
    var bemjson = findBemjson(group);

    if (!bemjson) {
        return null;
    }

    return {
        bemjson: bemjson,
        levels: _.difference(group, [bemjson])
    }
}

function findBemjson(dirContents) {
    return _.find(dirContents, entry => {
        return utils.isBemjsonFile(entry);
    });
}

function convertToStreamData(cache, levels) {
    return _(cache)
        .map((contents, name) => {
            return _.map(contents, (entry, bemjson) => {
                return {
                    bemjson: new Vinyl({path: path.join(name, bemjson.split('.')[0]+ '-examples', entry.bemjson)}),
                    levels: _.union(entry.levels, levels)
                }
            });
        })
        .flattenDeep()
        .value();
}
