'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var vow = require('vow');
var asyncRequire = require('require-async');

var Promise = vow.Promise;

module.exports = {

    /**
     * Find localization keysets files in given folder
     *
     * @param {String} folderPath folder which contains localization keysets
     * @returns {Promise}
     */
    exploreI18NFolderAsync: function(folderPath) {
        return new Promise(function (resolve, reject) {
            fs.readdir(folderPath, function (err, files) {
                if (err) {
                    reject(err);
                }
                return resolve(files);
            });
        });
    },

    /**
     * Merge keysets async for block
     *
     * @param {Object[]} keysests keysets of localization texts
     * @param {String} block block name which need merge keysets
     * @returns {Promise}
     */
    mergeKeysetsAsync: function(keysests, block) {
        return new Promise(function (resolve, reject) {
            var requireQueue = _.map(keysests, function(keyset) {
                return asyncRequire(path.resolve(keyset.path));
            });

            vow.all(requireQueue).then(function (modules) {
                var result = _.reduce(modules, function (merged, module) {
                    merged[block] = merged[block] || {};
                    Object.assign(merged[block], module[block]);
                    return merged;
                }, {});

                resolve(result);
            }).fail(function (err) {
                reject(err);
            });
        });
    }
};
