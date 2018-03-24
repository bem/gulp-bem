'use strict';
var path = require('path');

module.exports = {
    getLangFormFileName: function(file) {
        var fileName = path.basename(file);
        return fileName.split('.')[0];
    }
};
