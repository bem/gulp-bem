'use strict';

/**
 * Contains info about files in levels for bundle.
 */
module.exports = class Introspection {
    constructor(levelPaths, introspections) {
        this._levelPaths = levelPaths;
        this._introspections = introspections;
    }
    /**
     * Returns all level paths.
     *
     * @returns {String[]}
     */
    levels() {
        return this._levelPaths;
    }
    /**
     * Returns all files.
     *
     * @returns {Iterator}
     */
    *files() {
        for (const introspection of this._introspections) {
            for (const files of introspection.values()) {
                yield* files;
            }
        }
    }
    /**
     * Returns info about files of specified entity.
     *
     * @param {Object} entity
     * @returns {Iterator}
     */
    *entityFiles(entity) {
        for (const introspection of this._introspections) {
            yield* introspection.get(entity.id);
        }
    }
    /**
     * Returns info about files with specified tech.
     *
     * @param {string} tech
     * @returns {Iterator}
     */
    *techFiles(tech) {
        for (const introspection of this._introspections) {
            for (const files of introspection.values()) {
                for (const file of files) {
                    if (file.tech === tech) {
                        yield file;
                    }
                }
            }
        }
    }
};
