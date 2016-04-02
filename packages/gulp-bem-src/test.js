'use strict';

const src = require('./index');
const config = {
    '../bem-components/common.blocks': { scheme: 'nested' }
};

var stream = src({
    decl: [{ block: 'button' }],
    levels: ['../bem-components/common.blocks'],
    tech: 'css',
    extensions: ['.js', '.css'],
    config: config
})

stream.on('data', function (data) {
    console.log(data.path);
});

stream.on('end', function () {
    console.log('end');
});

stream.on('error', function (err) {
    console.log(err);
});
