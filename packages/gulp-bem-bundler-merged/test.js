const intoStream = require('into-stream');

const BemBundle = require('@bem/bundle');

const mergedBundler = require('./');

intoStream.obj([
    { decl: [{block: 'b'}], levels: ['./x'] },
    { decl: [{block: 'c'}], levels: ['./y'] },
    { decl: [{block: 'c'}], levels: ['./zxc'] },
    { decl: [{block: 'b'}, {block: 'd'}, {block: 'b4'}, {block: 'b3'}, {block: 'b2'}] },
])
    .pipe(mergedBundler({ name: 'obschij', mergeLevels: true }))
    .on('data', d => console.log(d, d.decl))
    .on('error', console.log);
