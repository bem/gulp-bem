'use strict';

const through2 = require('through2');
const Converter = require('./converter');
const debug = require('debug')('index');

module.exports = (levels) => {
    const converter = new Converter(levels);

    return through2.obj((vinyl, enc, callback) => {
        converter.appendExample(vinyl, callback);
    }, function(callback) {
        var converted = converter.getResults();

        debug('flush');
        debug(converted);
        converted.map(this.push.bind(this));
        callback();
    });
};
