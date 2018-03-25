'use strict';

const deps = require('@bem/sdk.deps');

const readDeps = deps.read();
const parseDeps = deps.parse();
const buildGraph = deps.buildGraph;

const loadDeps = async (introspection) => {
    const depFiles = Array.from(introspection.techFiles('deps.js'));

    const depFilesContents = await readDeps(depFiles);

    return parseDeps(depFilesContents);
};

module.exports = async (introspection) => {
    const deps = await loadDeps(introspection);

    return buildGraph(deps);
};
