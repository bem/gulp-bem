gulp-bem-bundler-fs
===================

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Coverage Status][coverage-img]][coveralls]

[npm]:          https://www.npmjs.org/package/gulp-bem-bundler-fs
[npm-img]:      https://img.shields.io/npm/v/gulp-bem-bundler-fs.svg

[travis]:       https://travis-ci.org/gulp-bem/gulp-bem-bundler-fs
[test-img]:     https://img.shields.io/travis/gulp-bem/gulp-bem-bundler-fs.svg

[coveralls]:    https://coveralls.io/r/gulp-bem/gulp-bem-bundler-fs
[coverage-img]: https://img.shields.io/coveralls/gulp-bem/gulp-bem-bundler-fs.svg

Install
-------

```
$ npm install --save-dev gulp-bem-bundler-fs
```

Usage
-----

```js
const bundler = require('gulp-bem-bundler-fs');
const builder = require('gulp-bem-bundle-builder');

bundler('*.bundles/*')
    .pipe(builder(bundle => ({
        css: {
            transform: stylus()
                .pipe(postcss([
                    autoprefixer({
                        browsers: ['ie >= 10', 'last 2 versions', 'opera 12.1', '> 2%']
                    }),
                    postcssUrl({ url: 'inline' })
                ]))
                .pipe(csso())
        }
    })));
```
