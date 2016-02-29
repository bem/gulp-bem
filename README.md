# gulp-bem-xjst

> Compile [bemhtml](http://en.bem.info/technology/bemhtml/v2/reference/) templates into JavaScript


## Install

```sh
$ npm install @bem/gulp-bem-xjst
```


## Usage

```js
var gulp = require('gulp');
var bemhtml = require('@bem/gulp-bem-xjst').bemhtml;

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

### Plugin options

* *String* **exportName** — Engine handler's variable name. Default — `BEMHTML`.
* *String* **engine** — Engine's name. Default — `BEMHTML`.
* *String* **extension** — extension for file. Default — `.${engine}.js`.
