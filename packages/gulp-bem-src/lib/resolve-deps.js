'use strict';

const BemCell = require('@bem/sdk.cell');

module.exports = (decl, bemGraph, tech) => {
    const entities = bemGraph.dependenciesOf(decl, tech);

    return entities.map(BemCell.create);
};
