'use strict';

var assert = require('assert');
var path = require('path');

var bemxjst = require('bem-xjst');
var gutil = require('gulp-util');
var through = require('through2');
var geval = require('gulp-eval');
var File = require('vinyl');
var isStream = require('isstream');

var formatError = require('./error');

var PluginError = gutil.PluginError;

var pluginName = path.basename(__dirname);

/**
 * bem-xjst templates compiler.
 *
 * @param {{extension: string}} options - Options for generator.
 * @param {String} engine - bemhtml or bemtree.
 * @returns {Stream}
 */
module.exports = function(options, engine) {
  options = options || {};
  engine = engine || 'bemhtml';
  assert(bemxjst[engine], 'Invalid engine');

  return through.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new PluginError(pluginName, 'Streaming not supported'));
    }

    var res;
    var code = file.contents.toString();

    try {
      res = bemxjst[engine].generate(code, options);
    } catch (e) {
      var err = new PluginError(pluginName, formatError(e, code, file.path), {
        fileName: file.path
      });
      return callback(err);
    }

    file.contents = new Buffer(res);
    file.path = gutil.replaceExtension(file.path, options.extension || ('.' + engine + '.js'));

    callback(null, file);
  });
};

module.exports.bemhtml = function(options) {
  return module.exports(options, 'bemhtml');
};

module.exports.bemtree = function(options) {
  return module.exports(options, 'bemtree');
};

module.exports.toHtml = function(tmpl) {
  return geval().pipe(through.obj(function(bemjsonFile, _, callback) {
    if (bemjsonFile.isNull()) {
      return callback(null, bemjsonFile);
    }
    if (bemjsonFile.isStream()) {
      return callback(new PluginError(pluginName, 'Streaming not supported'));
    }

    if (!isStream(tmpl)) {
      return callback(new PluginError(pluginName, 'Parameter should be a Stream'));
    }

    // Handle multiple templates case
    var n = 0;

    tmpl
      .pipe(through.obj(function(file, __, tmplCallback){
        if (file.isStream()) {
          return tmplCallback(new PluginError(pluginName, 'Substreaming not supported'));
        }
        return tmplCallback(null, file);
      }))
      .pipe(geval())
      .pipe(through.obj(function(file) {
        if (file.isNull()) {
          return callback(null, file);
        }

        var html = tryCatch(() => file.data.apply(bemjsonFile.data), callback);
        if (!html) {
          return callback(null);
        }

        var name = path.basename(bemjsonFile.path).split('.')[0];
        var newFile = new File({
          path: name + (n-- || '') + '.html',
          contents: new Buffer(html)
        });

        return callback(null, newFile);
      }));
    }));
};

/**
 * Try to run function and call handler if it throws.
 *
 * @param {Function} fn - Unsafe function body
 * @param {Function} cb - Error handler
 * @returns {*}
 */
function tryCatch(fn, cb) {
  try {
    return fn();
  } catch (e) {
    return cb(e);
  }
}
