'use strict';

const bundler = require('./index');

var stream = bundler('./fixtures/bundles/*');

stream.on('data', function (data) {
    console.log('data: ', data);
});

stream.on('end', function () {
    console.log('end');
});

stream.on('error', function (err) {
    console.log(err.stack);
    console.log('error:', err);
});
