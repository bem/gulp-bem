const { describe, it } = require('mocha');
const assert = require('chai').assert;

const Stream = require('stream');

const concat = require('gulp-concat');
const streamFromArray = require('stream-from-array');
const toArray = require('stream-to-array');
const mockfs = require('mock-fs');

const BemBundle = require('@bem/sdk.bundle');
const File = require('vinyl');

const Builder = require('..');
const builder = Builder({levels: 'blocks'});

describe('gulp-bem-bundle-builder (basic)', () => {
    afterEach(() => {
        mockfs.restore()
    });

    it('should generate js/css files for bemBundle', async () => {
        mockfs({
          'blocks/b/b.css': ``,
          'bundles/bundle2/bundle2.bemdecl.js': `[{block: 'b'}]`,
          'bundles/bundle2/bundle-blocks/b/b.js': `console.log(1);`,
          'bundles/bundle2/bundle-blocks/b/b.css': `body { color: red }`
        });

        const sourceBundles = [
            new BemBundle({
                path: 'bundles/bundle2/bundle2.bemdecl.js',
                decl: [{block: 'b'}],
                levels: ['bundles/bundle2/bundle-blocks']
            })
        ];
        const stream = streamFromArray.obj(sourceBundles)
            .pipe(builder({
                js: bundle => bundle.src('js').pipe(concat(bundle.name + '.js')),
                css: bundle => bundle.src('css').pipe(concat(bundle.name + '.css'))
            }));
        const bundlePaths = (await toArray(stream)).map(b => b.path);

        assert.deepEqual(bundlePaths, ['bundles/bundle2/bundle2.js', 'bundles/bundle2/bundle2.css']);
    });

    it('should generate js/css files for bemBundle', async () => {
        mockfs({
          'blocks/b/b.css': ``,
          'blocks/b/b.js': ``,
          'bundleX.bemdecl.js': `[{block: 'b'}]`
        });

        const sourceBundles = [
            new BemBundle({
                path: 'bundleX.bemdecl.js',
                decl: [{block: 'b'}]
            })
        ];
        const stream = streamFromArray.obj(sourceBundles)
            .pipe(builder({
                js: bundle => bundle.src('js').pipe(concat(bundle.name + '.js')),
                css: bundle => bundle.src('css').pipe(concat(bundle.name + '.css'))
            }));
        const bundlePaths = (await toArray(stream)).map(b => b.path);

        assert.deepEqual(bundlePaths, ['bundleX.js', 'bundleX.css']);
    });

    // TODO: split to few test cases
    it('should generate js/css files for vinyl and resolve paths correctly', async () => {
        mockfs({
          'bundles/bundle2/bundle2.bemdecl.js': `[{block:'b'}]`,
          'blocks/b/b.js': `window`,
          'blocks/b/b.css': `html { background: green }`
        });

        const sourceBundles = [
            new File({
                cwd: '.',
                base: './bundles/bundle2',
                path: './bundles/bundle2/bundle2.bemdecl.js',
                contents: new Buffer(`[{block: 'b'}]`)
            })
        ];
        const stream = streamFromArray.obj(sourceBundles)
            .pipe(builder({
                js: bundle => bundle.src('js'),
              css: bundle => bundle.src('css')
            }))


        const bundlePaths = (await toArray(stream)).map(f => ({ path: f.path, relative: f.relative }));

        assert.deepEqual(bundlePaths, [
            {
                path: 'bundles/bundle2/b/b.js',
                relative: 'b/b.js'
            },
            {
                path: 'bundles/bundle2/b/b.css',
                relative: 'b/b.css'
            }
        ]);
    });

    it('should not pass non-vinyl and non-bem-bundle objects', () => {
        const stream = streamFromArray.obj([{}])
            .pipe(builder({any: () => {}}));

        assert.isRejected(toArray(stream), /Unacceptable object.*/);
    });

    it('should not pass unknown objects as ', () => {
        const stream = streamFromArray.obj([
            new File({path: 'unknown.file', contents: ''})
        ])
        .pipe(builder({any: () => {}}));

        assert.isRejected(toArray(stream), /Unacceptable.*unknown.file/);
    });

    it('should not pass unknown objects as ', () => {
        const stream = streamFromArray.obj([
            new File({path: 'qqq.bemjson.js', contents: new Buffer('wtf!content')})
        ])
        .pipe(builder({any: () => {}}));

        assert.isRejected(toArray(stream), /Unexpected token.*/);
    });

    it('should catch throwed error in stream generator', () => {
        const stream = streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: []
            })
        ])
        .pipe(builder({
            css: () => { throw new Error('oops'); }
        }));

        assert.isRejected(toArray(stream), /oops/);
    });

    it('should reemit an error in stream generator', () => {
        const stream = streamFromArray.obj([
            new BemBundle({
                path: 'bundle.bemdecl.js',
                decl: [{block: 'b'}]
            })
        ])
        .pipe(builder({
            res: () => (new Stream.Readable({objectMode: true, read: () => {}}))
                .emit('error', new Error('oops'))
        }));

        assert.isRejected(toArray(stream), /oops/);
    });
});
