'use strict';

var fs = require('fs');
var through = require('through2');

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
        if (!folder) {
            return callback(null, folder);
        }

        console.log('------ START -----');
        console.log(folder);
        console.log('------- END -------');
        // TODO: i18n
        callback(null, folder);
    });
};
