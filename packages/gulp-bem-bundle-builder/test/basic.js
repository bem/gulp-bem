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
    'bundles/bundle2/bundle2.bemdecl.js': `['b']`,
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
      array.map(f => path.basename(f.path)).should.eql(['bundle2.js', 'bundle2.css']);
    });
});

it('should generate js/css files for vinyl', () => {
  mockfs({
    'bundles/bundle2/bundle2.bemdecl.js': `['b']`,
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
      array.map(f => path.basename(f.path)).should.eql(['b.js', 'b.css']);
    });
});

});
