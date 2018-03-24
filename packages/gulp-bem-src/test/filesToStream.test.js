const path = require('path');

const { assert } = require('chai');
const mockfs = require('mock-fs');
const toArray = require('stream-to-array');
const parseEntity = require('@bem/sdk.naming.entity.parse')(require('@bem/sdk.naming.presets/origin'));

const lib = require('../');

describe('filesToStream', () => {
    afterEach(mockfs.restore);

    it('should return stream of files with contents', async () => {
        await checkFn({
            files: ['l1/f1.js', 'l1/f2.js'],
            fsFiles: {'l1/f1.js': '1', 'l1/f2.js': '2'},
            result: {'l1/f1.js': '1', 'l1/f2.js': '2'}
        });
    });

    it('should return stream of files without contents if read=false', async () => {
        await checkFn({
            files: ['l1/f1.js', 'l1/f2.js'],
            fsFiles: {'l1/f1.js': '1', 'l1/f2.js': '2'},
            options: {read: false},
            result: {'l1/f1.js': null, 'l1/f2.js': null}
        });
    });

    it('should return empty stream of files', async () => {
        await checkFn({
            files: [],
            fsFiles: {},
            result: {}
        });
    });

    it('should handle errored files promise correctly', () => {
        const promise = checkFn({
            files: ['l1/f1.js', null, 'l1/f2.js'],
            fsFiles: {'l1/f1.js': '1', 'l1/f2.js': '2'},
            options: {read: false},
            result: {'l1/f1.js': null}
        });

        assert.isRejected(promise, TypeError, /property.+of null/);
    });
});

async function checkFn(opts) {
    const fsFiles = opts.fsFiles || opts.files.reduce((res, f, idx) => { res[f] = String(idx); return res; }, {});
    mockfs(fsFiles);

    opts.options || (opts.options = {read: true});
    opts.files = opts.files.map(makeFileEntity);

    const files = await toArray(lib.filesToStream(opts.files, opts.options));
    const filesInfo = files.reduce((res, f) => { res[f.path] = f.contents && String(f.contents); return res; }, {})

    assert.deepEqual(filesInfo, opts.result);
}

function makeFileEntity(filepath) {
    if (!filepath) { return filepath; }
    const level = filepath.split('/')[0];
    const tech = path.basename(filepath).split('.').slice(1).join('.');
    const entityName = path.basename(filepath).split('.')[0];
    const entity = parseEntity(entityName);
    return {entity, level, tech, path: filepath};
}
