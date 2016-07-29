describe('gulp-bemhtml', function () {
  'use strict';

  var lib = require('..');
  var expect = require('expect.js');
  var bemxjst = require('bem-xjst');
  var gutil = require('gulp-util');
  var _eval = require('node-eval');

  describe('stream', function () {
    var stream;
    var vinylFile;

    before(function (next) {
      stream = lib.bemhtml();

      stream.on('data', function (file) {
        vinylFile = file;
      })
      .on('error', next)
      .on('end', next);

      stream.write(new gutil.File({
        path: 'page.bemhtml',
        contents: new Buffer('block(\'page\')(tag()(\'h1\'), content()(\'Hello, world!\'));')
      }));
      stream.end();
    });

    it('changes file extension to *.bemhtml.js', function () {
      expect(vinylFile.relative).to.be.equal('page.bemhtml.js');
    });

    it('outputs bemhtml templates compiler', function () {
      var bemhtml = _eval(vinylFile.contents.toString());
      expect(bemhtml.apply({block: 'page'})).to.be.equal('<h1 class="page">Hello, world!</h1>');
    });
  });

  describe('stream with custom engine', function () {
    var stream;
    var vinylFile;

    before(function (next) {
      stream = lib({}, bemxjst.bemhtml);

      stream.on('data', function (file) {
        vinylFile = file;
      })
      .on('error', next)
      .on('end', next);

      stream.write(new gutil.File({
        path: 'page.bemhtml',
        contents: new Buffer('block(\'page\')(tag()(\'h1\'), content()(\'Hello, world!\'));')
      }));
      stream.end();
    });

    it('changes file extension to *.bemhtml.js', function () {
      expect(vinylFile.relative).to.be.equal('page.bemhtml.js');
    });
  });
});
