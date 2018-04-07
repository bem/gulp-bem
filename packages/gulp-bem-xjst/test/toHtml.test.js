'use strict';

var lib = require('..');
var expect = require('expect.js');
var File = require('vinyl');
var intoStream = require('into-stream');

describe('gulp-bem-xjst (to-html)', function () {
    it('outputs html', function (done) {
        var bemhtmlStream = lib.bemhtml();

        var res = lib.toHtml(bemhtmlStream)
            .on('data', function (file) {
                expect(file.contents + '').to.be.equal('<h1 class="page">Hello, world!</h1>');
            })
            .on('error', done)
            .on('end', done);

        intoStream.obj([new File({
            path: 'index.bemjson.js',
            contents: new Buffer('module.exports = { block: \'page\' }')
        })]).pipe(res);

        intoStream.obj([new File({
            path: 'page.bemhtml.js',
            contents: new Buffer('block(\'page\')(tag()(\'h1\'), content()(\'Hello, world!\'));')
        })]).pipe(bemhtmlStream);

    });
});
