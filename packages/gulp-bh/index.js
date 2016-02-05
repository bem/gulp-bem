var vm = require('vm');
var through = require('through2');
var BH = require('bh').BH;
var path = require('path');


module.exports = function(opt) {
    var bh = new BH();
    opt && bh.setOptions(opt);

    function evalWithBH(content, filename) {
        var sandbox = {}
        var exports = {}

        sandbox.exports = exports
        sandbox.module = { exports: exports }
        sandbox.global = sandbox
        sandbox.bh = bh;

        return vm.runInNewContext(content, sandbox, {filename: filename});
    }

    return {
        match: function() {
            return through.obj(function(file, enc, next) {
                var fileContent = file.contents.toString(enc);
                matcher = evalWithBH(fileContent, file.relative);
                if (matcher !== bh) {
                    // module.exports = function(bh)
                    matcher(bh);
                }
                next(null, file);
            });
        },
        apply: function(filePath) {
            return through.obj(function(file, enc, next) {
                var fileContent = file.contents.toString(enc);
                bemJson = evalWithBH(fileContent, file.relative);
                if (filePath) {
                    file.path = path.join(file.base, filePath);
                }
                file.contents = new Buffer(bh.apply(bemJson));
                next(null, file);
            });
        }
    };

};
