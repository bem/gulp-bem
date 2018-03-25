'use strict';

const deps = require('@bem/sdk.deps');

const readDeps = deps.read();
const parseDeps = deps.parse();
const buildGraph = deps.buildGraph;

const getDepFiles = (introspection, levels) => {
    return introspection.filter(file => file.tech === 'deps.js')
        // Сортируем по уровням
        .sort((f1, f2) => (levels.indexOf(f1.level) - levels.indexOf(f2.level)))
};

const loadDeps = async (introspection, levels) => {
    const depFiles = getDepFiles(introspection, levels);
    const depFilesContents = await readDeps(depFiles);

    return parseDeps(depFilesContents);
}

module.exports = async (introspection, levels) => {
    const deps = await loadDeps(introspection, levels);

    return buildGraph(deps);
};
