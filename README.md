# gulp-bem

Usage
-----

```js
import gulp from 'gulp';
import bem from 'gulp-bem';
import concat from 'gulp-concat';
import merge from 'gulp-merge';
import bemhtml from 'gulp-bemhtml';
import stylus from 'gulp-stylus';
import postcss from 'gulp-postcss';
import postcssUrl from 'postcss-url';

// Создаём хелпер для сборки проекта
var project = bem({
    bemconfig: {
        'libs/bem-core/common.blocks': { scheme: 'nested' },
        'libs/bem-core/desktop.blocks': { scheme: 'nested' },
        'libs/bem-components/common.blocks': { scheme: 'nested' },
        'libs/bem-components/desktop.blocks': { scheme: 'nested' },
        'libs/bem-components/design/common.blocks': { scheme: 'nested' },
        'libs/bem-components/design/desktop.blocks': { scheme: 'nested' },
        'common.blocks': { scheme: 'nested' },
        'desktop.blocks': { scheme: 'nested' }
    }
});

// Создаём хелпер для сборки бандла
var bundle = project.bundle({
    path: 'desktop.bundles/index',
    declPath: 'index.bemdecl.js'
});

gulp.task('css', function () {
    bundle.src({tech: 'css', extensions: ['.css', '.styl']})
        .pipe(stylus())            
        .pipe(postcss([
            postcssUrl({ url: 'inline' })            
        ]))
        .pipe(concat(`${bundle.name()}.css`))
        .pipe(gulp.dest('desktop.bundles/index'));
});

gulp.task('js', function () {
    merge(
        gulp.src(require.resolve('ym')),
        bundle.src({ tech: 'js', extensions: ['.js', '.vanilla.js', '.browser.js'] })
    )
    .pipe(concat(`${bundle.name()}.js`))
    .pipe(gulp.dest('desktop.bundles/index'));
});

gulp.task('bemhtml', function () {
    bundle.src({ tech: 'bemhtml.js', extensions: ['.bemhtml.js', '.bemhtml'] })
        .pipe(concat(`${bundle.name()}.bemhtml.js`))            
        .pipe(bemhtml())
        .pipe(gulp.dest('desktop.bundles/index'));
});

gulp.task('build', gulp.series('css', 'js', 'bemhtml'));
gulp.task('default', gulp.series('build'));   
```
