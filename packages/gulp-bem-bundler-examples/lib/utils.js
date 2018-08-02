'use strict';

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

exports.getBlockName = function (vinyl) {
    return path.basename(vinyl.path).split('.')[0];
};

exports.isBemjsonFile = function(name) {
    return name.match(/\.bemjson\.js/);
};

exports.pathRelativeToRoot = function(vinyl) {
    return vinyl.path.replace(process.cwd(), '');
};

exports.readdir = promisify(fs.readdir);
