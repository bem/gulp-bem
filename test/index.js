describe('gulp-bemhtml', function () {
  'use strict';

  var lib = require('..');
  var expect = require('expect.js');
  var gutil = require('gulp-util');

  describe('stream', function () {
    var stream;
    var vinylFile;

    before(function (next) {
      stream = lib.bemhtml();

      stream.on('data', function (file) {
        vinylFile = file;
        next();
      });

      stream.write(new gutil.File({
        path: 'page.bemhtml',
        contents: new Buffer('block(\'page\')(tag()(\'h1\'), content()(\'Hello, world!\'));')
      }));
    });

    it('changes file extension to *.bemhtml.js', function () {
      expect(vinylFile.relative).to.be.equal('page.bemhtml.js');
    });

    it('outputs bemhtml templates compiler', function () {
      eval(vinylFile.contents.toString());
      var bemhtml = exports;
      expect(bemhtml.apply({block: 'page'})).to.be.equal('<h1 class="page">Hello, world!</h1>');
    });
  });
});
