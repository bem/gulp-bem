const path = require('path');

const concat = require('gulp-concat');
const streamFromArray = require('stream-from-array');
const toArray = require('stream-to-array');
const mockfs = require('mock-fs');
const chai = require('chai');

const BemBundle = require('bem-bundle');
const File = require('vinyl');

const Builder = require('..');
const builder = Builder({levels: 'blocks'});

chai.should();

describe('basic', function() {

afterEach(mockfs.restore);

it('should generate js/css files for bemBundle', () => {
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
        levels: ['bundle-blocks']
      })
    ])
    // Stream<BemBundle>
    .pipe(builder({
      js: bundle => bundle.src('js').pipe(concat(bundle.name + '.js')),
      css: bundle => bundle.src('css').pipe(concat(bundle.name + '.css'))
    }))
  )
    .then(array => {
      array.map(f => f.path).should.eql(['bundles/bundle2/bundle2.js', 'bundles/bundle2/bundle2.css']);
    });
});

it('should generate js/css files for bemBundle', () => {
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
      array.map(f => f.path).should.eql(['bundleX.js', 'bundleX.css']);
    });
});

// TODO: split to few test cases
it('should generate js/css files for vinyl and resolve paths correctly', () => {
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
      array.map(f => ({
        path: f.path,
        relative: f.relative
      }))
        .should.eql([{
          path: 'bundles/bundle2/b/b.js',
          relative: 'b/b.js'
        }, {
          path: 'bundles/bundle2/b/b.css',
          relative: 'b/b.css'
        }]);
    });
});

});
