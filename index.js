'use strict';

var bemxjst = require('bem-xjst');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');

var PluginError = gutil.PluginError;

var pluginName = path.basename(__dirname);

/**
 * bemhtml templates compiler.
 * @return {stream}
 */
module.exports = function (options) {
  var syntax = fs.readFileSync(path.resolve('./syntax/i-bem.bemhtml'), {encoding: 'utf8'});

  return through.obj(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new PluginError(pluginName, 'Streaming not supported'));
    }

    var bemhtml;

    try {
      bemhtml = bemxjst.generate(syntax + file.contents.toString(), options);
    } catch (err) {
      return callback(new PluginError(pluginName, err, {
        fileName: file.path
      }));
    }

    file.contents = new Buffer(bemhtml);
    file.path = gutil.replaceExtension(file.path, '.bemhtml.js');

    callback(null, file);
  });
};
