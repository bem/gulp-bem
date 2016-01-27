var through = require('through2'),
    _eval = require('./evalContent'),
    bemjsonToDecl = require('bemjson-to-decl')

module.exports = function(opts) {
    return through.obj(function(file, enc, next) {
        var fileContent = file.contents.toString(enc);
        var bemJson = _eval(fileContent);
        var entities = bemjsonToDecl.convert(bemJson);
        entities.forEach(function(entity) {
            this.push(entity);
        }, this);
        next();
    });
};
