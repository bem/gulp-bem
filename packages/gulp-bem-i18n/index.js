'use strict';

var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var _ = require('lodash');


var PluginError = gutil.PluginError;
var pluginName = path.basename(__dirname);


var exploreI18NFolder = function(folder) {
    return fs.readdirSync(folder.path);
};

var getLangFormFile = function(file) {
    var fileName = path.basename(file);
    return fileName.split('.')[0];
};

var keysetsToString = function(keysets, block) {
    var mergedKeysets = _.reduce(keysets, function (result, keyset) {
        var content = require(path.resolve(keyset.path));
        result[block] = result[block] || {};
        result[block] = Object.assign(result[block], content[block]);
        return result;
    }, {});

    return 'module.exports = ' + JSON.stringify(mergedKeysets) + ';'
};

/**
 * BEM i18n gulp plugin
 *
 * @param {Object} options options for plugin
 * @param {String[]} options.langs list of supported languages
 *
 * @returns {Stream}
 */
module.exports = function (options) {
    options = options || {};
    var parsedKeysets = [];

    return through.obj(function (folder, encoding, callback) {
        if(folder.isStream()) {
            return callback(new PluginError(pluginName, 'Stream not supported'))
        }

        if(!options.langs) {
            return callback(new PluginError(pluginName, 'Please specify languages'))
        }

        exploreI18NFolder(folder).forEach(function (file) {
            var fullFilePath = path.join(folder.path, file);
            if(_.includes(options.langs, getLangFormFile(fullFilePath))) {
                parsedKeysets.push({
                    entity: folder.entity,
                    level: folder.level,
                    path: fullFilePath
                });
            }
        });
        callback();
    }, function (callback) {
        var combinedFilesByBlock = {};
        _.map(parsedKeysets, function (keyset) {
            var nameBlock = keyset.entity.block;
            var filePath = keyset.path;
            var lang = getLangFormFile(filePath);
            if (!_.get(combinedFilesByBlock, [nameBlock, lang])) {
                _.set(combinedFilesByBlock, [nameBlock, lang], []);
            }
            combinedFilesByBlock[nameBlock][lang].push(filePath);
        });

        var keysetsByBlock = _.groupBy(parsedKeysets, function (keyset) {
            return _.get(keyset, 'entity.block');
        });

        var result = {};

        _.forEach(keysetsByBlock, function (keysets, block) {
            var keysetsByLanguage = _.groupBy(keysets, function (keyset) {
                return getLangFormFile(keyset.path);
            });
            result[block] = {};

            _.forEach(keysetsByLanguage, function (keyset, lang) {
                result[block][lang] = keysetsToString(keyset, block);
            });
        });

        this.push(result);

        callback();
    });
};
