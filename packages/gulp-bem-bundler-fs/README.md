gulp-bem-fs-bundler
===================

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Coverage Status][coverage-img]][coveralls]

[npm]:          https://www.npmjs.org/package/gulp-bem-fs-bundler
[npm-img]:      https://img.shields.io/npm/v/gulp-bem-fs-bundler.svg

[travis]:       https://travis-ci.org/gulp-bem/gulp-bem-fs-bundler
[test-img]:     https://img.shields.io/travis/gulp-bem/gulp-bem-fs-bundler.svg

[coveralls]:    https://coveralls.io/r/gulp-bem/gulp-bem-fs-bundler
[coverage-img]: https://img.shields.io/coveralls/gulp-bem/gulp-bem-fs-bundler.svg

Install
-------

```
$ npm install --save-dev gulp-bem-fs-bundler
```

Usage
-----

```js
const bundler = require('gulp-bem-fs-bundler');
const builder = require('gulp-bem-bundle-builder');

const transform =

bundler('*.bundles/*')
    .pipe(builder())
```
