'use strict';

const path = require('path');
const q = require('q');
const fs = require('fs');

exports.getBlockName = function (vinyl) {
    return path.basename(vinyl.path).split('.')[0];
};

exports.isBemjsonFile = function(name) {
    return name.match(/\.bemjson\.js/);
};

exports.pathRelativeToRoot = function(vinyl) {
    return vinyl.path.replace(process.cwd(), '');
};

exports.readdir = q.denodeify(fs.readdir);
