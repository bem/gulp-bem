describe('gulp-bem-xjst', function () {
    'use strict';

    var lib = require('..');
    var expect = require('expect.js');
    var bemxjst = require('bem-xjst');
    var File = require('vinyl');
    var _eval = require('node-eval');
    var intoStream = require('into-stream');

    describe('stream', function () {
        var stream;
        var vinylFile;

        before(function (next) {
            stream = lib.bemhtml()
                .on('data', function (file) {
                    vinylFile = file;
                })
                .on('error', next)
                .on('end', next);

            intoStream.obj([new File({
                    path: 'page.bemhtml',
                    contents: new Buffer('block(\'page\')(tag()(\'h1\'), content()(\'Hello, world!\'));')
                })])
                .pipe(stream);
        });

        it('changes file extension to *.bemhtml.js', function () {
            expect(vinylFile.relative).to.be.equal('page.bemhtml.js');
        });

        it('outputs bemhtml templates compiler', function () {
            var bemhtml = _eval(vinylFile.contents.toString());

            expect(bemhtml.BEMHTML.apply({block: 'page'})).to.be.equal('<h1 class="page">Hello, world!</h1>');
        });
    });

    describe('stream with custom engine', function () {
        var vinylFile;

        before(function (next) {
            const stream = lib({}, bemxjst.bemhtml)
                .on('data', function (file) {
                    vinylFile = file;
                })
                .on('error', next)
                .on('end', next);

            intoStream.obj([new File({
                path: 'page.bemhtml',
                contents: new Buffer('block(\'page\')(tag()(\'h1\'), content()(\'Hello, world!\'));')
            })])
                .pipe(stream);
        });

        it('changes file extension to *.bemhtml.js', function () {
            expect(vinylFile.relative).to.be.equal('page.bemhtml.js');
        });
    });
});
