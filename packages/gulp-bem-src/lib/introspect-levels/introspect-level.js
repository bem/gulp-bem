'use strict';

const fs = require('fs');
const { Writable } = require('stream');

const walk = require('@bem/sdk.walk');
const pify = require('pify');

/**
 * @param {string} levelPath
 * @param {*} bemConfig
 */
module.exports = async (levelPath, bemConfig) => {
    const levelMap = await Promise.resolve(bemConfig.levelMap ? bemConfig.levelMap() : {});

    return new Promise((resolve, reject) => {
        const entityMap = new Map();

        walk([levelPath], levelMap)
            .on('error', reject)
            .pipe(new Writable({
                objectMode: true,
                write(file, encoding, callback) {
                    tryCatch(async () => {
                        const id = file.entity.id;
                        const stats = await pify(fs.stat)(file.path);

                        file.stats = stats;

                        const entityFiles = entityMap.has(id) ? entityMap.get(id) : entityMap.set(id, new Set()).get(id);
                        entityFiles.add(file);

                        callback();
                    }, callback);
                }
            }))
            .on('error', reject)
            .on('finish', () => resolve(entityMap));
    });
};

// try-catch optimization
function tryCatch(tryFn, catchFn) {
    try {
        tryFn();
    } catch (err) {
        catchFn(err);
    }
}
