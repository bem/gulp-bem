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
 * @param {Object} options
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
  return through.obj().pipe(geval()).pipe(through.obj(function(bemjsonFile, encoding, callback) {
    if (bemjsonFile.isNull()) {
      return callback(null, bemjsonFile);
    }
    if (bemjsonFile.isStream()) {
      return callback(new PluginError(pluginName, 'Streaming not supported'));
    }

    if (!isStream(tmpl)) {
      return callback(new PluginError(pluginName, 'Parameter should be a Stream'));
    }

    tmpl
      .pipe(through.obj(function(file, encoding, callback){
        if (file.isStream()) {
          return callback(new PluginError(pluginName, 'Substreaming not supported'));
        }
        return callback(null, file);
      }))
      .pipe(geval())
      .pipe(through.obj(function(file) {
        if (file.isNull()) {
          return callback(null, file);
        }

        try {
          var bemjson = eval(bemjsonFile.contents + '');
          var html = file.data.apply(bemjson); // bemjsonFile.data);
        } catch (e) {
          return callback(e);
        }

        var newFile = new File({
          path: path.basename(bemjsonFile.path) + '.html',
          contents: new Buffer(html)
        });

        return callback(null, newFile);
      }));
    }));
};
