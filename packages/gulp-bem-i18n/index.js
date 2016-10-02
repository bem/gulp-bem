'use strict';

var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var Promise = require('vow').Promise;


var PluginError = gutil.PluginError;
var pluginName = path.basename(__dirname);


var exploreI18NFolder = function (folder) {
    return new Promise(function (resolve, reject) {
        fs.readdir(folder.path, function (err, files) {
            if (err) {
                reject(err);
            }
            resolve(files);
        });
    });
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

    return through.obj(function (folder, encoding, callback) {
        var _this = this;

        if(folder.isStream()) {
            return callback(new PluginError(pluginName, 'Stream not supported'))
        }
        exploreI18NFolder(folder)
            .then(function (files) {
                files.forEach(function (file) {
                    _this.push(new gutil.File({
                        path: path.join(folder.path, file)
                    }));
                });
                callback();
            })
            .catch(function (err) {
                console.log('------ START -----');
                console.log(err);
                console.log('------- END -------');
                return callback(new PluginError(pluginName, 'Error of reading ' + folder.path + ': ', err ));
            });
    });
};
