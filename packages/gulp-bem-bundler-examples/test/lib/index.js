'use strict';

var vfs = require('vinyl-fs'),
    converter = require('../../lib/index');

converter = converter([]);
vfs.src(['./common.blocks/**/*.examples'])
    .pipe(converter);
