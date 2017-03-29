const path = require('path');

const mockfs = require('mock-fs');
const toArray = require('stream-to-array');
const BemEntityName = require('@bem/entity-name');
const BemNaming = require('bem-naming');

const lib = require('../');

const chai = require('chai');
chai.should();

describe('src', () => {
    // Skipped because of https://github.com/bem-sdk/bem-walk/issues/76
    it.skip('should return no files if no files', function() {
        return checkSrc({
            files: {l1: {}, l2: {}},
            decl: ['b1', 'b2'],
            levels: ['l1', 'l2'],
            tech: 'js',
            result: []
        });
    });

    it('should return files for entities in decl without deps', function() {
        return checkSrc({
            files: ['l1/b2/b2.js', 'l1/b1/b1.es', 'l2/b1/b1.js', 'l2/b1/b1.css', 'l1/b1/b1.js', 'l2/b1/b1.es'],
            decl: ['b1', 'b2'],
            levels: ['l1', 'l2'],
            tech: 'js',
            result: ['l1/b1/b1.js', 'l1/b1/b1.es', 'l2/b1/b1.js', 'l2/b1/b1.es', 'l1/b2/b2.js'],
            techMap: { js: ['js', 'es'] },
            read: true
        });
    });

    it('should return something', function() {
        return checkSrc({
            files: {
                'l1/b1/b1.deps.js': `[{shouldDeps: {block: 'b2'}}]`,
                'l1/b1/b1.js': `1`,
                'l1/b2/b2.js': `2`
            },
            decl: ['b1'],
            levels: ['l1'],
            tech: 'qq',
            techMap: { qq: 'js' },
            result: ['l1/b1/b1.js', 'l1/b2/b2.js']
        });
    });

    afterEach(mockfs.restore);
});

function checkSrc(opts) {
    const files = Array.isArray(opts.files)
        ? opts.files.reduce((res, f, idx) => {
            res[f] = String(idx);
            return res;
        }, {})
        : opts.files;

    mockfs(files);

    opts.decl = opts.decl.map(makeEntity);
    opts.result = opts.result.map(makeFileEntity);

    const config = {
        levelMap: () => Promise.resolve(
            opts.levels.reduce((res, levelpath) => {
                res[levelpath] = {};
                return res;
            }, {}))
    };

    return toArray(lib(opts.levels, opts.decl, opts.tech, {config, techMap: opts.techMap}))
        .then(res => {
            res.map(f => ({path: f.path, contents: f.contents && String(f.contents)}))
                .should.eql(opts.result.map(f => ({path: f.path, contents: files[f.path]})));
        });
}

function makeFileEntity(filepath) {
    const level = filepath.split('/')[0];
    const tech = path.basename(filepath).split('.').slice(1).join('.');
    const entityName = path.basename(filepath).split('.')[0];
    const entity = makeEntity(entityName);
    return {entity, level, tech, path: filepath};
}

function makeEntity(str) {
    return new BemEntityName(BemNaming.parse(str));
}
