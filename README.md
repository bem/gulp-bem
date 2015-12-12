# gulp-bem

```js
import gulp from 'gulp';
import gBem from 'gulp-bem';
import gConcat from 'gulp-concat';
import gMerge from 'gulp-merge';

let bem = new gBem({
    levels: {
        'lib/bem-core/common.blocks': { scheme: 'nested' },
        'lib/bem-core/desktop.blocks': { scheme: 'nested' },
        'common.blocks': { scheme: 'flat' },
        'desktop.blocks': { scheme: 'flat' }
    }
});

// building one bundle with waiting for completing all substreams
gulp.task('build', () => {
    let res = [],
        name = 'index',
        bundlePath = tech => `desktop.bundles/index${tech? `/${name}.${tech}` : ''}`,
        opts = {
            decl: bundlePath('bemdecl.js')
        };

    res.push(bem.src(Object.assign({}, opts, {tech: 'css'}))
        .pipe(gConcat(`${name}.css`)));

    res.push(bem.src(Object.assign({}, opts, {tech: 'js'}))
        .pipe(gConcat(`${name}.js`)));

    res.push(bem.src(Object.assign({}, opts, {tech: 'bemhtml.js'}))
        .pipe(gConcat(''))
        .pipe(apply(gulp.src(bundlePath('bemjson.js'))))
        .pipe(gRename(`${name}.html`)));

    return gMerge.apply(null, res)
        .pipe(gulp.dest(bundlePath()));
});

```
