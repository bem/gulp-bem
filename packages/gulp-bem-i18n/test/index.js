'use strict';

var lib = require('..');
var gutil = require('gulp-util');

describe('gulp-bem-i18n', function () {
    it('test', function () {
        var stream = lib({});
        stream.write(new gutil.File({
            path: 'ru.js',
            contents: new Buffer('module.exports = { \'page\': { \'title\': \'test\' } }')
        }));
        stream.end();
    })
});
