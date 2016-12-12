'use strict';

var fs = require('fs');

var utils = require('../../lib/utils');

var sandbox;

describe('utils', function() {
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });
});


