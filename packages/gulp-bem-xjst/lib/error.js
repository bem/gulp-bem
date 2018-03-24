'use strict';

var path = require('path');
var util = require('util');

var format = util.format;

/**
 * @param {{description: string, column: number, lineNumber: number}} err - Error data
 * @param {String} code - Code sample
 * @param {String} filepath - Path to the file
 * @return {String|Object}
 */
module.exports = function (err, code, filepath) {
    // Assume that esprima parser failed
    if (err.description && err.column && err.lineNumber) {
        var source = code.split('\n');

        var addtionalLines = 3;
        var errorLine = err.lineNumber; // extra line from length prop
        var startLine = Math.max(errorLine - addtionalLines, 0);
        var endLine = Math.min(errorLine + addtionalLines, source.length);

        var fragment = source.slice(startLine, endLine);
        // Adding marker
        fragment.splice(errorLine - startLine + 1, 0, Array(err.column).join(' ') + '^');

        var message = format('%s at %s:\n%s',
            err.description,
            path.basename(filepath),
            fragment.join('\n'));

        return message;
    }

    return err;
};
