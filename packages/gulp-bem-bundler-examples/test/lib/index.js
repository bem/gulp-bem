'use strict';

const vfs = require('vinyl-fs');
const stringifier = new require('streaming-json-stringify')();

let converter = require('../../lib/index');

converter = converter(['common.blocks', 'desktop.blocks']);
vfs.src(['./common.blocks/**/*.examples', './desktop.blocks/**/*.examples'])
    .pipe(converter)
    .pipe(stringifier)
    .pipe(process.stdout);
