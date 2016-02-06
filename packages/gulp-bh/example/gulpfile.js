
var gulp = require('gulp'),
    bh = require('../index.js')();

gulp.task('default', function() {
    gulp.src('*.bh.js')
        .pipe(bh.match());

    return gulp.src('index.bemjson.js')
        .pipe(bh.apply('index.html'))
        .pipe(gulp.dest('./bundle'));
})
