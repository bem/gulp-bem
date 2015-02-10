'use strict';

/**
 * @param  {object} err
 * @param  {string} syntax
 * @param  {string} code
 * @return {string|object}
 */
module.exports = function (err, syntax, code) {
  // Assume that esprima parser failed
  if (err.description && err.lineNumber) {
    var shownLines = 3;
    var fSyntax = syntax.split('\n');
    var fCode = code.split('\n');
    var synLen = fSyntax.length;
    var lineNumber = err.lineNumber - synLen;

    if (lineNumber < 0) {
      return 'Problems with syntax file';
    }

    var start = lineNumber - shownLines - 1;
    var fragment = fCode.slice(start > 0 ? start : 0, lineNumber + shownLines);
    return err.description + '\n\n' + fragment.join('\n');
  }

  return err;
};
