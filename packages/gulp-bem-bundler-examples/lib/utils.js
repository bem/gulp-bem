'use strict';

const path = require('path');
const q = require('q');
const fs = require('fs');

exports.getBlockName = function(vinyl) {
    return path.basename(vinyl.path).split('.')[0];
};

exports.isBemjsonFile = function(name) {
    return name.match(/\.bemjson\.js/);
};

exports.readdir = q.denodeify(fs.readdir);
