'use strict';

const fs = require('fs');
const { Writable } = require('stream');

const introspectLevel = require('./introspect-level');
const Introspection = require('./introspection');

const levelCache = {};

/**
 * @param {string[]} levelPaths
 * @param {*} bemConfig
 * @returns {Introspection}
 */
module.exports = async (levelPaths, bemConfig, { cache=false } = {}) => {
    const levelIntrospections = await Promise.all(levelPaths.map(levelPath => {
        if (cache && levelCache[levelPath]) {
            return levelCache[levelPath];
        }

        const introspect = introspectLevel(levelPath, bemConfig);

        levelCache[levelPath] = introspect;

        return introspect;
    }));

    return new Introspection(levelPaths, levelIntrospections);
};
