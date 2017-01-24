'use strict';

const bundler = require('./index');

var stream = bundler('./fixtures/bundles/*', { levels: ['blocks/wefwef'] });

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
