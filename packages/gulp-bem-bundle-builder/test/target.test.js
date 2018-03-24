const { describe, it } = require('mocha');
const assert = require('chai').assert;

const concat = require('gulp-concat');
const streamFromArray = require('stream-from-array');
const toArray = require('stream-to-array');
const mockfs = require('mock-fs');

const BemBundle = require('@bem/sdk.bundle');
const File = require('vinyl');

const Builder = require('..');
const builder = Builder({levels: 'blocks'});

describe('gulp-bem-bundle-builder (target)', () => {
    afterEach(() => {
        mockfs.restore()
    });

    it('should use another target as source', async () => {
        mockfs({
            'blocks/b/b.js': `/* js */`,
            'bundleX.bemdecl.js': `[{block: 'b'}]`
        });

        const stream = streamFromArray.obj([
            new BemBundle({
                path: 'bundleX.bemdecl.js',
                decl: [{block: 'b'}]
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            xjs: bundle => bundle.src('js').pipe(concat(bundle.name + '.js')),
            magic: bundle => bundle.target('xjs').pipe(concat(bundle.name + '.magic'))
        }));

        const bundlesInfo = (await toArray(stream)).map(f => `${f.path}: ${f.contents}`);

        assert.deepEqual(bundlesInfo, ['bundleX.js: /* js */', 'bundleX.magic: /* js */']);
    });

    it('should resolve targets recursively', async () => {
        const stream = streamFromArray.obj([
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
        }));

        const bundlesInfo = (await toArray(stream)).map(f => `${f.path}: ${f.contents}`).filter(v => v !== 'x: x');

        assert.deepEqual(bundlesInfo, ['bundle.res: x']);
    });

    it('should use target instead of loading files if there is a target', async () => {
        mockfs({
            'bundle.x': `x`
        });

        const stream = streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: []
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            x: () => streamFromArray.obj([new File({path: 'x', contents: new Buffer('dynamic x')})]),
            res: bundle => bundle.target('x').pipe(concat(`${bundle.name}.res`))
        }));

        const bundlesInfo = (await toArray(stream)).map(f => `${f.path}: ${f.contents}`);

        assert.deepEqual(bundlesInfo, ['x: dynamic x', 'bundle.res: dynamic x']);
    });

    it('should try to load files from fs if there is no target', async () => {
        mockfs({
            'bundle.x': `x`
        });

        const stream = streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: []
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            res: bundle => bundle.target('x').pipe(concat(`${bundle.name}.res`))
        }));

        const bundlesInfo = (await toArray(stream)).map(f => `${f.path}: ${f.contents}`);

        assert.deepEqual(bundlesInfo, ['bundle.res: x']);
    });

    it('should catch and emit an error for target', () => {
        const stream = streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: [{block: 'b'}]
            })
        ])
        // Stream<BemBundle>
        .pipe(builder({
            res: bundle => bundle.target('unknown.target')
        }));

        assert.isRejected(toArray(stream), /ENOENT:.*bundle.unknown.target/);
    });
});
