'use strict';

var fs = require('fs');
var path = require('path');
var vow = require('vow');

var _ = require('lodash');
var asyncRequire = require('require-async');

var utils = require('./utils');

var KeysetManager = function(langs) {
    this._keysetMetaInfo = [];
    this._supportedLangs = langs;
};


KeysetManager.prototype.addFolder = function(folder) {
    var _this = this;
    var folderPath = folder.path;
    return _this._loadFolderAsync(folderPath)
        .then(function(files) {
            var keysetsMetaInfo = _.reduce(files, function(result, file) {
                var filePath = path.join(folderPath, file);
                var lang = utils.getLangFormFileName(filePath);
                if(_.includes(_this._supportedLangs, lang)) {
                    result.push({
                        entity: folder.entity,
                        level: folder.level,
                        path: filePath
                    });
                }
                return result;
            }, []);
            _this._keysetMetaInfo = _.union(_this._keysetMetaInfo, keysetsMetaInfo);
        });
};

KeysetManager.prototype.getMergedKeysets = function() {
    var _this = this;
    var metadata = this._prepareMetadata();

    var mergeQueue = _.map(metadata, function(keysetInfo) {
        var blockName = keysetInfo.block;
        var lang = keysetInfo.lang;
        return _this._mergeKeysetsByBlock(keysetInfo.keysetsMeta, blockName)
            .then(function(keyset) {
                return {
                    block: blockName,
                    lang: lang,
                    keyset: keyset
                };
            });
    }, {});

    return vow.all(mergeQueue)
        .then(function(mergedKeysets) {
            return _.reduce(mergedKeysets, function(result, keysetInfo) {
                _.set(result, [keysetInfo.block, keysetInfo.lang], keysetInfo.keyset);
                return result;
            }, {});
        });
};

KeysetManager.prototype._mergeKeysetsByBlock = function(keysetsMeta, block) {
    var _this = this;
    var getKeysetsQueue = _.map(keysetsMeta, function(keysetMeta) {
        return _this._getKeysetAsync(keysetMeta);
    });

    return vow.all(getKeysetsQueue)
        .then(function(keysets) {
            return _.reduce(keysets, function(merged, keyset) {
                merged[block] = merged[block] || {};
                Object.assign(merged[block], keyset[block]);
                return merged;
            });
        });
};

KeysetManager.prototype._getKeysetAsync = function(keysetMeta) {
    return new vow.Promise(function(resolve, reject) {
        asyncRequire(path.resolve(keysetMeta.path), function(err, content) {
            if (err) {
                reject(err);
                return;
            }

            resolve(content);
        });
    });
};

KeysetManager.prototype._prepareMetadata = function() {
    var result = [];
    var keysetsMetaByBlock = _.groupBy(this._keysetMetaInfo, function (keysetMeta) {
        return _.get(keysetMeta, 'entity.block');
    });

    _.forEach(keysetsMetaByBlock, function (keysetsMeta, block) {
        var keysetsByLanguage = _.groupBy(keysetsMeta, function (keysetMeta) {
            return utils.getLangFormFileName(keysetMeta.path);
        });
        result[block] = {};

        _.forEach(keysetsByLanguage, function (keysetsMetadata, lang) {
            result.push({
                block: block,
                lang: lang,
                keysetsMeta: keysetsMeta
            });
        });
    });

    return result;
};

KeysetManager.prototype._loadFolderAsync = function (folderPath) {
    return new vow.Promise(function(resolve, reject) {
        fs.readdir(folderPath, function(err, files) {
            if (err) {
                reject(err);
                return;
            }
            resolve(files);
        });
    });
};


module.exports = KeysetManager;
