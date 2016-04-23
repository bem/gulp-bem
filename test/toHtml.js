'use strict';

var lib = require('..');
var expect = require('expect.js');
var gutil = require('gulp-util');

describe('toHtml', function () {

    it('outputs html', function (done) {
        var bemhtmlStream = lib.bemhtml();

        var res = lib.toHtml(bemhtmlStream)
            .on('data', function (file) {
                expect(file.contents + '').to.be.equal('<h1 class="page">Hello, world!</h1>');
                done();
            });

        res.write(new gutil.File({
                path: 'index.bemjson.js',
                contents: new Buffer('module.export = { block: \'page\' }')
            }));

        res.write(null);

        bemhtmlStream.write(new gutil.File({
            path: 'page.bemhtml',
            contents: new Buffer('block(\'page\')(tag()(\'h1\'), content()(\'Hello, world!\'));')
        }));
        bemhtmlStream.write(null)

    });
});
