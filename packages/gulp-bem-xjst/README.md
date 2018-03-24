# gulp-bem-xjst

> Compile [bemhtml](http://en.bem.info/technology/bemhtml/v2/reference/) templates into JavaScript

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Coverage Status][coverage-img]][coveralls]
[![Dependency Status][david-img]][david]

[npm]:          https://www.npmjs.org/package/gulp-bem-xjst
[npm-img]:      https://img.shields.io/npm/v/gulp-bem-xjst.svg
[travis]:       https://travis-ci.org/gulp-bem/gulp-bem-xjst
[test-img]:     https://img.shields.io/travis/gulp-bem/gulp-bem-xjst.svg?label=tests
[coveralls]:    https://coveralls.io/r/gulp-bem/gulp-bem-xjst
[coverage-img]: https://img.shields.io/coveralls/gulp-bem/gulp-bem-xjst.svg
[david]:        https://david-dm.org/gulp-bem/gulp-bem-xjst
[david-img]:    https://img.shields.io/david/gulp-bem/gulp-bem-xjst.svg

## Requirements

* [Node.js 4+](https://nodejs.org/en/)

## Install

```sh
$ npm install gulp-bem-xjst
```

## Usage

```js
var gulp = require('gulp');
var bemhtml = require('gulp-bem-xjst').bemhtml;

gulp.task('default', function () {
  return gulp.src('page.bemhtml')
    .pipe(bemhtml())
    .pipe(gulp.dest('dist'));
});
```

```sh
$ node -p "require('./dist/page.bemhtml.js').apply({block: 'page'});"
```

## API

bem-xjst engines accesible via properties `bemhtml` and `bemtree`:
```
var engine = require('gulp-bem-xjst')[engine];
```

### Plugin options

* *String* **exportName** — Engine handler's variable name. Default — `BEMHTML`.
* *String* **engine** — Engine's name. Default — `BEMHTML`.
* *String* **extension** — extension for file. Default — `.${engine}.js`.

### License

[MIT](./LICENSE)
