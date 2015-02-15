'use strict';

var bemxjst = require('bem-xjst');
var formatError = require('./error');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');

var PluginError = gutil.PluginError;

var pluginName = path.basename(__dirname);
var syntaxPath = path.join(__dirname, './syntax/i-bem.bemhtml');

/**
 * bemhtml templates compiler.
 *
 * @param {object} options
 * @param {boolean} options.cache
 * @param {boolean} options.devMode
 * @param {string} options.exportName
 * @param {object} options.modulesDeps
 * @return {stream}
 */
module.exports = function (options) {
  return through.obj(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new PluginError(pluginName, 'Streaming not supported'));
    }

    options = options || {};
    options = {
      cache: !options.devMode && options.cache,
      exportName: options.exportName,
      modulesDeps: options.modulesDeps,
      optimize: !options.devMode,
      wrap: true
    };

    fs.readFile(syntaxPath, {encoding: 'utf8'}, function (err, syntax) {
      if (err) {
        return callback(new PluginError(pluginName, err.code + ', Failed to open file with bemhtml syntax', {
          fileName: syntaxPath
        }));
      }

      var bemhtml;
      var code = file.contents.toString();

      try {
        bemhtml = bemxjst.generate(syntax + code, options);
      } catch (e) {
        err = new PluginError(pluginName, formatError(e, syntax, code, file.path), {
          fileName: file.path
        });
      }

      if (err) {
        return callback(err);
      }

      file.contents = new Buffer(bemhtml);
      file.path = gutil.replaceExtension(file.path, '.bemhtml.js');

      callback(null, file);
    });
  });
};
