const test = require('ava');

const concat = require('gulp-concat');
const streamFromArray = require('stream-from-array');
const toArray = require('stream-to-array');
const mockfs = require('mock-fs');

const BemBundle = require('@bem/sdk.bundle');
const File = require('vinyl');

const Builder = require('..');
const builder = Builder({levels: 'blocks'});

test.afterEach.always(() => mockfs.restore());

test.serial('should use another target as source', t => {
    mockfs({
        'blocks/b/b.js': `/* js */`,
        'bundleX.bemdecl.js': `[{block: 'b'}]`
    });
    return toArray(streamFromArray.obj([
            new BemBundle({
                path: 'bundleX.bemdecl.js',
                decl: [{block: 'b'}]
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            xjs: bundle => bundle.src('js').pipe(concat(bundle.name + '.js')),
            magic: bundle => bundle.target('xjs').pipe(concat(bundle.name + '.magic'))
        })))
        .then(array => {
            t.deepEqual(array.map(f => `${f.path}: ${f.contents}`),
                ['bundleX.js: /* js */', 'bundleX.magic: /* js */']);
        });
});

test('should resolve targets recursively', t => {
    return toArray(streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: []
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            x: () => streamFromArray.obj([new File({path: 'x', contents: new Buffer('x')})]),
            y: bundle => bundle.target('x'),
            z: bundle => bundle.target('y'),
            res: bundle => bundle.target('z').pipe(concat(`${bundle.name}.res`))
        })))
        .then(array =>
            t.deepEqual(array.map(f => `${f.path}: ${f.contents}`).filter(v => v !== 'x: x'),
                ['bundle.res: x']));
});

test.serial('should use target instead of loading files if there is a target', t => {
    mockfs({
        'bundle.x': `x`
    });
    return toArray(streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: []
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            x: () => streamFromArray.obj([new File({path: 'x', contents: new Buffer('dynamic x')})]),
            res: bundle => bundle.target('x').pipe(concat(`${bundle.name}.res`))
        })))
        .then(array =>
            t.deepEqual(array.map(f => `${f.path}: ${f.contents}`),
                ['x: dynamic x', 'bundle.res: dynamic x']));
});

test.serial('should try to load files from fs if there is no target', t => {
    mockfs({
        'bundle.x': `x`
    });
    return toArray(streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: []
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            res: bundle => bundle.target('x').pipe(concat(`${bundle.name}.res`))
        })))
        .then(array =>
            t.deepEqual(array.map(f => `${f.path}: ${f.contents}`),
                ['bundle.res: x']));
});

test('should catch and emit an error for target', t => {
    t.throws(toArray(streamFromArray.obj([
        new BemBundle({
            path: 'bundle.bemdecl.js',
            decl: [{block: 'b'}]
        })
    ])
    // Stream<BemBundle>
    .pipe(builder({
        res: bundle => bundle.target('unknown.target')
    }))), /ENOENT:.*bundle.unknown.target/);
});
