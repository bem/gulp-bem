var through = require('through2'),
    vm = require('vm'),
    normalize = require('bem-decl').normalize;

module.exports = function(opts) {
    function _eval(content) {
        var sandbox = {}
        var exports = {}

        sandbox.exports = exports
        sandbox.module = { exports: exports }
        sandbox.global = sandbox

        var script = new vm.Script(content);
        return script.runInNewContext(sandbox);
    }

    return through.obj(function(file, enc, next) {
        debugger;
        var fileContent = file.contents.toString(enc);
        var bemDecl = _eval(fileContent);
        var entities = normalize(bemDecl);
        entities.forEach(function(entity) {
            this.push(entity);
        }, this);
        next();
    });
};
