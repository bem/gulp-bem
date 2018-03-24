gulp-bem-bundler-merged
=======================

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Coverage Status][coverage-img]][coveralls]

[npm]:          https://www.npmjs.org/package/gulp-bem-bundler-merged
[npm-img]:      https://img.shields.io/npm/v/gulp-bem-bundler-merged.svg

[travis]:       https://travis-ci.org/gulp-bem/gulp-bem-bundler-merged
[test-img]:     https://img.shields.io/travis/gulp-bem/gulp-bem-bundler-merged.svg

[coveralls]:    https://coveralls.io/r/gulp-bem/gulp-bem-bundler-merged
[coverage-img]: https://img.shields.io/coveralls/gulp-bem/gulp-bem-bundler-merged.svg

Install
-------

```
$ npm install --save-dev gulp-bem-bundler-merged
```

Usage
-----

```js
const bundler = require('gulp-bem-bundler-fs');
const mergedBundler = require('gulp-bem-bundler-merged');

bundler('*.bundles/*')
    .pipe(mergedBundler({
        name: 'common',
        path: './*.bundles/common'
    }))
    .on('data', data => {
        console.log(data.name);
        console.log(data.decl);
    });
// common
// [ {block: 'a'}, {block: 'b'}, {block: 'c'}, ... ]
```
