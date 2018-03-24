gulp-enb-src
============

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Windows Status][appveyor-img]][appveyor]
[![Coverage Status][coverage-img]][coveralls]
[![Dependency Status][david-img]][david]

[npm]:          https://www.npmjs.org/package/gulp-enb-src
[npm-img]:      https://img.shields.io/npm/v/gulp-enb-src.svg

[travis]:       https://travis-ci.org/gulp-bem/gulp-enb-src
[test-img]:     https://img.shields.io/travis/gulp-bem/gulp-enb-src.svg

[appveyor]:     https://ci.appveyor.com/project/blond/gulp-enb-src
[appveyor-img]: http://img.shields.io/appveyor/ci/blond/gulp-enb-src.svg

[coveralls]:    https://coveralls.io/r/gulp-bem/gulp-enb-src
[coverage-img]: https://img.shields.io/coveralls/gulp-bem/gulp-enb-src.svg

[david]:        https://david-dm.org/gulp-bem/gulp-enb-src
[david-img]:    http://img.shields.io/david/gulp-bem/gulp-enb-src.svg

Helper to get sources with ENB.

Returns a stream of [vinyl](https://github.com/gulpjs/vinyl) file objects.

Install
-------

```
$ npm install --save gulp-enb-src
```

Usage
-----

```js
const gulp = require('gulp');
const src = require('gulp-enb-src');
const read = require('gulp-read');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

return src({
    levels: ['blocks'],
    decl: [{ block: 'button' }]
    tech: 'js',
    extensions: ['.vanilla.js', '.js', '.browser.js']
})
.pipe(read())
.pipe(concat('button.min.js'))
.pipe(uglify())
.pipe(gulp.dest('build'));
```

License
-------

MIT © [Andrew Abramov](https://github.com/blond)
