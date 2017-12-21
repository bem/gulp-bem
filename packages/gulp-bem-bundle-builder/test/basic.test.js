const test = require('ava');

const Stream = require('stream');

const concat = require('gulp-concat');
const streamFromArray = require('stream-from-array');
const toArray = require('stream-to-array');
const mockfs = require('mock-fs');

const BemBundle = require('@bem/sdk.bundle');
const File = require('vinyl');

const Builder = require('..');
const builder = Builder({levels: 'blocks'});

test.afterEach.always(() => mockfs.restore());

test.serial('should generate js/css files for bemBundle', t => {
  mockfs({
    'blocks/b/b.css': ``,
    'bundles/bundle2/bundle2.bemdecl.js': `[{block: 'b'}]`,
    'bundles/bundle2/bundle-blocks/b/b.js': `console.log(1);`,
    'bundles/bundle2/bundle-blocks/b/b.css': `body { color: red }`
  });
  return toArray(streamFromArray.obj([
      new BemBundle({
        path: 'bundles/bundle2/bundle2.bemdecl.js',
        decl: [{block: 'b'}],
        levels: ['bundles/bundle2/bundle-blocks']
      })
    ])
    // Stream<BemBundle>
    .pipe(builder({
      js: bundle => bundle.src('js').pipe(concat(bundle.name + '.js')),
      css: bundle => bundle.src('css').pipe(concat(bundle.name + '.css'))
    }))
  )
    .then(array => {
      t.deepEqual(array.map(f => f.path),
        ['bundles/bundle2/bundle2.js', 'bundles/bundle2/bundle2.css']);
    });
});

test.serial('should generate js/css files for bemBundle', t => {
  mockfs({
    'blocks/b/b.css': ``,
    'blocks/b/b.js': ``,
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
      js: bundle => bundle.src('js').pipe(concat(bundle.name + '.js')),
      css: bundle => bundle.src('css').pipe(concat(bundle.name + '.css'))
    }))
  )
    .then(array => {
      t.deepEqual(array.map(f => f.path),
        ['bundleX.js', 'bundleX.css']);
    });
});

// TODO: split to few test cases
test.serial('should generate js/css files for vinyl and resolve paths correctly', t => {
  mockfs({
    'bundles/bundle2/bundle2.bemdecl.js': `[{block:'b'}]`,
    'blocks/b/b.js': `window`,
    'blocks/b/b.css': `html { background: green }`
  });
  return toArray(streamFromArray.obj([
      new File({
        cwd: '.',
        base: './bundles/bundle2',
        path: './bundles/bundle2/bundle2.bemdecl.js',
        contents: new Buffer(`[{block: 'b'}]`)
      })
    ])
    // Stream<BemBundle>
    .pipe(builder({
      js: bundle => bundle.src('js'),
      css: bundle => bundle.src('css')
    }))
  )
    .then(array => {
      t.deepEqual(array.map(f => ({
        path: f.path,
        relative: f.relative
      })),
        [{
          path: 'bundles/bundle2/b/b.js',
          relative: 'b/b.js'
        }, {
          path: 'bundles/bundle2/b/b.css',
          relative: 'b/b.css'
        }]);
    });
});

test('should not pass non-vinyl and non-bem-bundle objects', t => {
    t.throws(toArray(streamFromArray.obj([
        {}
    ])
    .pipe(builder({any: () => {}}))),
    /Unacceptable object.*/);
});

test('should not pass unknown objects as ', t => {
    t.throws(toArray(streamFromArray.obj([
        new File({path: 'unknown.file', contents: ''})
    ])
    .pipe(builder({any: () => {}}))),
    /Unacceptable.*unknown.file/);
});

test('should not pass unknown objects as ', t => {
    t.throws(toArray(streamFromArray.obj([
        new File({path: 'qqq.bemjson.js', contents: new Buffer('wtf!content')})
    ])
    .pipe(builder({any: () => {}}))),
    /Unexpected token.*/);
});

test('should catch throwed error in stream generator', t => {
    t.throws(toArray(streamFromArray.obj([
        new BemBundle({
            path: 'bundle.bemdecl.js',
            decl: []
        })
    ])
    // Stream<BemBundle>
    .pipe(builder({
        css: () => { throw new Error('oops'); }
    }))), /oops/);
});

test('should reemit an error in stream generator', t => {
    t.throws(toArray(streamFromArray.obj([
        new BemBundle({
            path: 'bundle.bemdecl.js',
            decl: [{block: 'b'}]
        })
    ])
    // Stream<BemBundle>
    .pipe(builder({
        res: () => (new Stream.Readable({objectMode: true, read: () => {}}))
            .emit('error', new Error('oops'))
    }))), /oops/);
});
