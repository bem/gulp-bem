# gulp-bemhtml

> Compile bemhtml templates into JavaScript


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
$ node -p "require('./page.bemhtml.js').apply({block: 'page'});"
```
