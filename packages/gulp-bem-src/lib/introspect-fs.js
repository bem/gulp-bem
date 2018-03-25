'use strict';

const assert = require('assert');
const path = require('path');

const walk = require('@bem/sdk.walk');
const streamToArray = require('stream-to-array');

/**
 * Получаем слепок файловой структуры с уровней
 *
 * @param {string[]} levels - levels to use to search files
 * @param {*} bemConfig
 */
module.exports = async (levels, bemConfig) => {
    assert(Array.isArray(levels) && levels.length, 'Levels required to get some files');

    const levelMap = await Promise.resolve(bemConfig.levelMap ? bemConfig.levelMap() : {});
    const introspectionStream = walk(levels, { levels: levelMap });

    let hasSomeData = false;
    introspectionStream.on('data', () => { hasSomeData = true; });

    return new Promise((resolve, reject) => {
        setTimeout(() => hasSomeData ||
            reject('Looks like there are no files. ' +
                 'See also https://github.com/bem-sdk/bem-walk/issues/76'), 1000);

        streamToArray(introspectionStream).then(resolve).catch(reject);
     });
};
