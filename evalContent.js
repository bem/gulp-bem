var vm = require('vm');

function _eval(content) {
    var sandbox = {};

    sandbox.module = { exports: exports };
    sandbox.exports = exports;
    sandbox.global = sandbox;

    return vm.runInNewContext(content, sandbox);
}

module.exports = _eval;
