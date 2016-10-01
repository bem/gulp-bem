'use strict';

var path = require('path');
var lib = require('..');
var mock = require('mock-fs');
var gutil = require('gulp-util');
var StreamFromArray = require('stream-from-array');

var basePath = path.join(__dirname, '..');

// Явно устанавливаем рабочую директорию, что бы она не зависела от ПО запуска тестов
process.chdir(basePath);

describe('gulp-bem-i18n', function () {

    beforeEach(function () {
        mock({
            'common.blocks/header/header.i18n': {
                'ru.js': 'module.exports = { \'header\': { \'title\': \'тест\' } }',
                'en.js': 'module.exports = { \'header\': { \'title\': \'test\' } }'
            },
            'common.blocks/page-layout/page-layout.i18n': {
                'ru.js': 'module.exports = { \'page-layout\': { \'footer\': \'тест\' } }',
                'en.js': 'module.exports = { \'page-layout\': { \'footer\': \'test\' } }'
            }
        })
    });

    it('test', function () {
        var folders = [
            new gutil.File({
                path: 'common.blocks/header/header.i18n'
            }),
            new gutil.File({
                path: 'common.blocks/page-layout/page-layout.i18n'
            })
        ];
        StreamFromArray.obj(folders).pipe(lib({}));
    });
});
