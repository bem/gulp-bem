'use strict';

const _ = require('lodash');
const path = require('path');
const Vinyl = require('vinyl');
const utils = require('./utils');


class Converter {
    constructor(levels) {
        this._levels = levels || [];
        this._bundles = {};
    }

    appendExample(example, cb) {
        const blockName = utils.getBlockName(example);
        const exampleRelativePath = utils.pathRelativeToRoot(example);

        utils.readdir(example.path)
            .then(this._groupExampleContents)
            .then(this._bundlesFromGroupedContents.bind(this))
            .then(this._cacheBundles.bind(this, blockName, exampleRelativePath))
            .done(cb);
    }

    getResults() {
        function buildResultEntry(name, entry) {
            const bemjson = entry.bemjson;
            const vinyl = new Vinyl();

            entry.bemjsonPaths.forEach(p => {
                vinyl.path = path.join(p, bemjson);
            });

            vinyl.path = path.join(name, bemjson.split('.')[0]+ '.examples', bemjson);

            return {
                bemjson: vinyl,
                levels: _.union(entry.levels, this._levels)
            };
        }

        return _(this._bundles)
            .map((contents, name) => _.map(contents, buildResultEntry.bind(this, name)))
            .flattenDeep()
            .value();
    }

    _groupExampleContents(contents) {
        return _.groupBy(contents, entry => entry.split('.')[0]);
    }
    
    _bundlesFromGroupedContents(groupedContents) {
        return _(groupedContents)
            .map(this._groupToBundle.bind(this))
            .compact()
            .value();
    }

    _groupToBundle(group) {
        const bemjson = this._findBemjson(group);

        return bemjson
            ? {bemjson: bemjson, levels: _.difference(group, [bemjson])}
            : null;
    }

    _findBemjson(group) {
        return _.find(group, utils.isBemjsonFile);
    }

    _cacheBundles(blockName, exampleRelativePath, bundles) {
        const accumulated = this._bundles[blockName] || {};

        bundles.forEach(bundle => {
            const prevBundle = accumulated[bundle.bemjson];

            if (prevBundle) {
                prevBundle.levels = _.union(prevBundle.levels, bundle.levels);
                prevBundle.bemjsonPaths.push(exampleRelativePath);
            } else {
                bundle.bemjsonPaths = [exampleRelativePath];
                accumulated[bundle.bemjson] = bundle;
            }

            this._bundles[blockName] = accumulated;
        });
    }
}

module.exports = Converter;
