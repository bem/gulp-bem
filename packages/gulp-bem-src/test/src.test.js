const path = require('path');
const inspect = require('util').inspect;

const { assert } = require('chai');
const mockfs = require('mock-fs');
const toArray = require('stream-to-array');
const parseEntity = require('@bem/sdk.naming.entity.parse')(require('@bem/sdk.naming.presets/origin'));

const lib = require('../');

describe('src', () => {
    afterEach(mockfs.restore);

    it('should return no files if no files', async () => {
        await checkSrc({
            files: {l1: {}, l2: {}},
            decl: ['b1', 'b2'],
            levels: ['l1', 'l2'],
            tech: 'js',
            result: []
        });
    });

    it('should return files for entities in decl without deps', async () => {
        await checkSrc({
            files: ['l1/b2/b2.js', 'l1/b1/b1.es', 'l2/b1/b1.js', 'l2/b1/b1.css', 'l1/b1/b1.js', 'l2/b1/b1.es'],
            decl: ['b1', 'b2'],
            levels: ['l1', 'l2'],
            tech: 'js',
            result: ['l1/b1/b1.js', 'l1/b1/b1.es', 'l2/b1/b1.js', 'l2/b1/b1.es', 'l1/b2/b2.js'],
            techMap: { js: ['js', 'es'] },
            read: true
        });
    });

    it('should return resolved deps only if deps option passed', async () => {
        await checkSrc({
            files: {
                'l1/b1/b1.deps.js': `[{ shouldDeps: [{elem: 'e'}] }]`,
                'l2/b1/b1.deps.js': `[{ shouldDeps: [{mod: 'm'}] }]`
            },
            decl: ['b1'],
            levels: ['l2', 'l1'],
            tech: 'js',
            options: { deps: true },
            result: [{
                path: 'anonymous.deps.js',
                contents: inspect([
                    { tech: 'js', block: 'b1' },
                    { tech: 'js', block: 'b1', mod: 'm', val: true },
                    { tech: 'js', block: 'b1', elem: 'e' }
                ])
            }]
        });
    });

    it('should return resolved named deps file if deps option passed with string', async () => {
        await checkSrc({
            files: {'l1': {}}, // Walker doesn't work if no directory exists
            decl: ['b1'],
            levels: ['l1'],
            tech: 'js',
            options: { deps: 'bundle.deps.js' },
            result: [{
                path: 'bundle.deps.js',
                contents: inspect([{ tech: 'js', block: 'b1' }])
            }]
        });
    });

    it('should return something', async () => {
        await checkSrc({
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

    it('should skip resolving deps step', async () => {
        await checkSrc({
            files: {
                'l1/b1/b1.deps.js': `[{shouldDeps: {block: 'b2'}}]`,
                'l1/b1/b1.js': `1`,
                'l1/b2/b2.js': `2`
            },
            decl: ['b1'],
            levels: ['l1'],
            tech: 'qq',
            techMap: { qq: 'js' },
            options: { skipResolvingDependencies: true },
            result: ['l1/b1/b1.js']
        });
    });
});

async function checkSrc(opts) {
    const files = Array.isArray(opts.files)
        ? opts.files.reduce((res, f, idx) => {
            res[f] = String(idx);
            return res;
        }, {})
        : opts.files;

    mockfs(files);

    opts.decl = opts.decl.map(parseEntity);
    opts.result = opts.result.map(makeFileEntity);

    const config = {
        levelMap: () => Promise.resolve(
            opts.levels.reduce((res, levelpath) => {
                res[levelpath] = {};
                return res;
            }, {}))
    };

    const res = await toArray(lib(opts.levels, opts.decl, opts.tech, Object.assign({config, techMap: opts.techMap}, opts.options)))
    const actual = res.map(f => ({path: f.path, contents: f.contents && String(f.contents)}));
    const expected = opts.result.map(f => ({path: f.path, contents: f.contents || files[f.path]}));

    assert.deepEqual(actual, expected);
}

function makeFileEntity(filepath) {
    const contents = filepath.contents;
    typeof filepath === 'object' && (filepath = filepath.path);

    const level = filepath.split('/')[0];
    const tech = path.basename(filepath).split('.').slice(1).join('.');
    const entityName = path.basename(filepath).split('.')[0];
    const entity = parseEntity(entityName);
    return {entity, level, tech, path: filepath, contents};
}
