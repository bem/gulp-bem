# gulp-bem-bundle-builder

Easy to use builder for streams of [`BemBundle`][]
and [`Vinyl`][] objects;

[![NPM Status][npm-img]][npm]
[![Travis Status][travis-img]][travis]
[![Coverage Status][coveralls-img]][coveralls]
[![Dependency Status][david-img]][david]

## Install

```sh
npm i gulp-bem-bundle-builder
```

## Usage

```js
const concat = require('gulp-concat');
const bundlerFs = require('gulp-bem-bundler-fs'); // Read bundles from FS by glob
const bundleBuilder = require('gulp-bem-bundle-builder');

// Create an instance with configuration to run typical build tasks
const builder = bundleBuilder({
    config: {
        levels: {
            'libs/super-library/blocks': {scheme: 'nested'},
            'blocks': {scheme: 'nested'}
        }
    },
    levels: [
        'libs/super-library/blocks',
        'blocks'
    ],
    techMap: {
        js: ['vanilla.js', 'browser.js', 'js'],
        css: ['styl', 'css']
    }
});

bundlerFs('bundles/*')
    .pipe(builder({
        css: bundle => bundle.src('css').pipe(concat('file.css')),
        js: bundle => bundle.src('js').pipe(concat('file.js'))
    }))
    .pipe(...) // Stream<Vinyl>
    .pipe(gulp.dest('.'));
```

## API

### `BundleBuilder`

```js
BundleBuilder({
    config: ?BemConfig,          // BEM-project configuration
    levels: ?String[],           // Levels to use for building by default
    techMap: ?Object             // Mapping deps to file tech
}):
    function(Object<tech: String, function(bundle: BundleBuilder~Bundle): Stream<Vinyl>>):
        TransformStream<Vinyl|BemBundle, Vinyl>
```

### `BundleBuilder~Bundle`

[`BemBundle`][] class extended by `src` and `target` helper methods.

### `BundleBuilder~Bundle.src`

Gather vinyl file objects that responde to [BEM entity][] declaration
and their dependencies and return them as a readable stream.

```js
Bundle.src(tech: String, opts: ?Object): Stream<Vinyl>
```

### `BundleBuilder~Bundle.target`

Returns resulting stream of a target.

```js
Bundle.target(target: String): Stream<Vinyl>
```

**NB:** Beware of cycles:
```js
builder({
    a: bundle => bundle.target('b'),
    b: bundle => bundle.target('a')
});
```

## License

Code and documentation copyright 2016 YANDEX LLC. Code released under the [Mozilla Public License 2.0](LICENSE.txt).


[`BemBundle`]:   https://github.com/bem-sdk/bem-bundle
[`Vinyl`]:       https://github.com/gulpjs/vinyl
[BEM entity]:    https://en.bem.info/methodology/key-concepts/#bem-entity

[npm]:           https://www.npmjs.org/package/gulp-bem-bundle-builder
[npm-img]:       https://img.shields.io/npm/v/gulp-bem-bundle-builder.svg
[travis]:        https://travis-ci.org/gulp-bem/gulp-bem-bundle-builder
[travis-img]:    https://img.shields.io/travis/gulp-bem/gulp-bem-bundle-builder.svg?label=tests
[coveralls]:     https://coveralls.io/r/gulp-bem/gulp-bem-bundle-builder
[coveralls-img]: https://img.shields.io/coveralls/gulp-bem/gulp-bem-bundle-builder.svg
[david]:         https://david-dm.org/gulp-bem/gulp-bem-bundle-builder
[david-img]:     http://img.shields.io/david/gulp-bem/gulp-bem-bundle-builder.svg?style=flat
