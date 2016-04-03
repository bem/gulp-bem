'use strict';

var vfs = require('vinyl-fs'),
    converter = require('../../lib/index');

converter = converter(['common.blocks', 'desktop.blocks']);
vfs.src(['./common.blocks/**/*.examples', './desktop.blocks/**/*.examples']).pipe(converter);
