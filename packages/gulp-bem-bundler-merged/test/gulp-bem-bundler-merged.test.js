const assert = require('assert');

const intoStream = require('into-stream');
const BemCell = require('@bem/sdk.cell');

const mergedBundler = require('..');

const bundlify = b => { b.decl = b.decl.map(BemCell.create); return b; };

describe('gulp-bem-bundler-merged', () => {
    it('should merge ', async () => {
        const res = await toArray(
            intoStream.obj([
                { name: 'x', decl: [{block: 'b'}], levels: ['./x'] },
                { name: 'y', decl: [{block: 'c'}], levels: ['./y'] },
                { name: 'z', decl: [{block: 'c'}], levels: ['./z'] },
                { name: 'q', decl: [{block: 'b'}, {block: 'd'}, {block: 'b4'}, {block: 'b3'}, {block: 'b2'}] }
            ].map(bundlify))
            .pipe(mergedBundler({ name: 'obschij', mergeLevels: true }))
        );

        assert.equal(res[0].levels.length, 3, '')

        assert.equal(res[0].decl.map(c => c.id).join(','), 'b,c,d,b4,b3,b2');
    });
});

function toArray(stream) {
    return new Promise((resolve, reject) => {
        const res = [];
        stream
            .on('data', (data) => res.push(data))
            .on('end', () => resolve(res))
            .on('error', (e) => reject(e));
    });
}
