var through = require('through2');

module.exports = function(parser) {

    return through.obj(function(file, enc, next) {
        (parser(file.data) || []).forEach(function(entity) {
            this.push(entity);
        }, this);
        next();
    });
};
