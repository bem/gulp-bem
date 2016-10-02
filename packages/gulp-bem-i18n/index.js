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
    var regex = /(.*)\/(.*)\.js$/;
    var results = regex.exec(file);
    return results[2];
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
    var parsedFiles = [];

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
                parsedFiles.push({
                    entity: folder.entity,
                    level: folder.level,
                    path: fullFilePath
                });
            }
        });
        callback();
    }, function (callback) {
        console.log('------ START -----');
        console.log(parsedFiles);
        console.log('------- END -------');
        callback();
    });
};
