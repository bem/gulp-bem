'use strict';

var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var _ = require('lodash');

var KeysetManager = require('./lib/keyset-manager');


var PluginError = gutil.PluginError;
var pluginName = path.basename(__dirname);

/**
 * BEM i18n gulp plugin
 *
 * @param {Object} options options for plugin
 * @param {String[]} options.langs list of supported languages
 * @param {Function} options.postProcessor function for process keysets after merge
 *
 * @returns {Stream}
 */
module.exports = function (options) {
    options = options || {};
    var keysetManager = null;

    return through.obj(function (folder, encoding, callback) {
        var _this = this;
        keysetManager = new KeysetManager(options.langs);
        if(folder.isStream()) {
            return callback(new PluginError(pluginName, 'Stream not supported'));
        }

        if(!options.langs) {
            return callback(new PluginError(pluginName, 'Please specify languages'));
        }

        keysetManager.addFolder(folder)
            .always(function() {
                _this.resume();
            })
            .then(function() {
                callback();
            })
            .catch(function(err) {
                callback(new PluginError(pluginName, err));
            });
        _this.pause();
    }, function (callback) {
        var _this = this;
        keysetManager.getMergedKeysets()
            .always(function() {
                _this.resume();
            })
            .then(function (mergedKeysets) {
                var postProcessor = options.postProcessor;
                if (postProcessor && _.isFunction(postProcessor)) {
                    this.push(postProcessor(mergedKeysets));
                    return;
                }
                this.push(mergedKeysets);
                callback();
            })
            .catch(function(err) {
                callback(new PluginError(pluginName, err));
            });
        _this.pause();
    });
};
