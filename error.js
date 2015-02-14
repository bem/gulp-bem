'use strict';

var util = require('util');
var format = util.format;

/**
 * @param  {object} err
 * @param  {string} syntax
 * @param  {string} code
 * @return {string|object}
 */
module.exports = function (err, syntax, code) {
  // Assume that esprima parser failed
  if (err.description && err.column && err.lineNumber) {
    var syntaxLines = syntax.split('\n').length;

    // Looks like we got corrupted bemhtml syntax file
    if (syntaxLines >= err.lineNumber) {
      return 'Problems with syntax file';
    }

    var source = code.split('\n');

    var addtionalLines = 3;
    var errorLine = err.lineNumber - syntaxLines; // extra line from length prop
    var startLine = Math.max(errorLine - addtionalLines, 0);
    var endLine = Math.min(errorLine + addtionalLines, source.length);

    var fragment = source.slice(startLine, endLine);
    // Adding marker
    fragment.splice(errorLine - startLine + 1, 0, Array(err.column).join(' ') + '^');

    var message = format('%s\n\n%s', err.description, fragment.join('\n'));

    return message;
  }

  return err;
};
