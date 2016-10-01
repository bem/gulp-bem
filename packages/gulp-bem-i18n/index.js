'use strict';

var path = require('path');

var through = require('through2');
var gutil = require('gulp-util');

var PluginError = gutil.PluginError;
var pluginName = path.basename(__dirname);

/**
 * BEM i18n gulp plugin
 *
 * @param {Object} options options for plugin
 *
 * @returns {Stream}
 */
module.exports = function (options) {
    options = options || {};

    return through.obj(function (file, encoding, callback) {
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(new PluginError(pluginName, 'Stream not supported'));
        }

        console.log('------ START -----');
        console.log(file);
        console.log('------- END -------');
    });
};
