# gulp-bemhtml

> Compile [bemhtml](http://en.bem.info/technology/bemhtml/v2/reference/) templates into JavaScript


## Install

```sh
$ npm install gulp-bemhtml
```


## Usage

```js
var gulp = require('gulp');
var bemhtml = require('gulp-bemhtml');

gulp.task('default', function () {
  return gulp.src('page.bemhtml')
    .pipe(bemhtml({cache: true, devMode: false}))
    .pipe(gulp.dest('dist'));
});
```

```sh
$ node -p "require('./dist/page.bemhtml.js').BEMHTML.apply({block: 'page'});"
```


## API

### plugin options

* *Boolean* **cache** &mdash; caching. Perhaps in the production mode. Default &mdash; `false`.
* *Boolean* **devMode** &mdash; development mode. Default &mdash; `true`.
* *String* **exportName** &mdash; bemhtml handler's variable name. Default &mdash; `BEMHTML`.
