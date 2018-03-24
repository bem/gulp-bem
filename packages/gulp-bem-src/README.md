gulp-bem-src
============

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Coverage Status][coverage-img]][coveralls]

[npm]:          https://www.npmjs.org/package/gulp-bem-src
[npm-img]:      https://img.shields.io/npm/v/gulp-bem-src.svg

[travis]:       https://travis-ci.org/gulp-bem/gulp-bem-src
[test-img]:     https://img.shields.io/travis/gulp-bem/gulp-bem-src.svg

[coveralls]:    https://coveralls.io/r/gulp-bem/gulp-bem-src
[coverage-img]: https://img.shields.io/coveralls/gulp-bem/gulp-bem-src.svg

Install
-------

```
$ npm install --save-dev gulp-bem-src
```

Usage
-----

```js
const src = require('gulp-bem-src');

const postcss = require('gulp-postcss');
const postcssUrl = require('postcss-url');

src(
    ['libs/islands/common.blocks/', 'blocks']
    [{ block: 'button' }],
    'styles', // wished dependencies technology
    {
        skipResolvingDependencies: false, // false by default, set to true if you dont want to resolve deps
        techMap: { // use this to map internal techs to file techs
            styles: ['sass', 'styl', 'css']
        },
        config: {
            'libs/bem-core/common.blocks': { scheme: 'nested' },
            'libs/bem-core/desktop.blocks': { scheme: 'nested' },
            'libs/bem-components/common.blocks': { scheme: 'nested' },
            'libs/bem-components/desktop.blocks': { scheme: 'nested' },
            'libs/bem-components/design/common.blocks': { scheme: 'nested' },
            'libs/bem-components/design/desktop.blocks': { scheme: 'nested' },
            'common.blocks': { scheme: 'nested' },
            'desktop.blocks': { scheme: 'nested' }
        }
    }
)
.pipe(postcss([
    postcssUrl({ url: 'inline' })
]))
.pipe(concat(`${bundle.name()}.css`));
```
