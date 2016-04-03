'use strict';

const path = require('path');

exports.getBlockName = function(vinyl) {
    return path.basename(vinyl.path).split('.')[0];
};

exports.isBemjsonFile = function(name) {
    return name.match(/\.bemjson\.js/);
};
