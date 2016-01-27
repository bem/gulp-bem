var vm = require('vm');

function _eval(content) {
    var sandbox = {};
    var exports = {};

    sandbox.exports = exports;
    sandbox.module = { exports: exports };
    sandbox.global = sandbox;

    var script = new vm.Script(content);
    return script.runInNewContext(sandbox);
}

module.exports = _eval;
