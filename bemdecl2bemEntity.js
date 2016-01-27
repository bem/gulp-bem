var through = require('through2'),
    _eval = require('./evalContent'),
    normalize = require('bem-decl').normalize;

module.exports = function() {
    return through.obj(function(file, enc, next) {
        var fileContent = file.contents.toString(enc);
        var bemDecl = _eval(fileContent);
        var entities = normalize(bemDecl);
        entities.forEach(function(entity) {
            this.push(entity);
        }, this);
        next();
    });
};
