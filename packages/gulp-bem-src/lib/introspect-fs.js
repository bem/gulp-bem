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
    const introspectionStream = walk(levels, { defaults: { naming: 'legacy' }, levels: levelMap });

    return streamToArray(introspectionStream);
};
