'use strict';

const through2 = require('through2');
const debug = require('debug')('gulp-bem-bundler-examples');

const Converter = require('./converter');

module.exports = (levels) => {
    const converter = new Converter(levels);

    return through2.obj(async (vinyl, _, next) => {
        await converter.appendExample(vinyl);
        next();
    }, function(next) {
        const converted = converter.getResults();

        debug(converted);

        for (const example of converted) {
            this.push(example);
        }
        next();
    });
};
