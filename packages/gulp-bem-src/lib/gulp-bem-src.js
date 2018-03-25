'use strict';

const assert = require('assert');
const path = require('path');
const inspect = require('util').inspect;
const Readable = require('stream').Readable;

const BemCell = require('@bem/sdk.cell');
const bemConfig = require('@bem/sdk.config');
const File = require('vinyl');
const read = require('gulp-read');

const introspectFs = require('./introspect-fs');
const buildBemGraph = require('./build-bem-graph');
const resolveDeps = require('./resolve-deps');
const filesToStream = require('./files-to-stream');

module.exports = src;

src.filesToStream = filesToStream;
src.harvest = harvest;

const declToEntities = (decl, tech) => {
    return decl.map(entity => {
        var e = entity.valueOf();

        entity = typeof e === 'object' ? e : entity;

        return Object.assign({}, entity, { tech });
    }).map(BemCell.create);
};

async function _getBundleInfo(sources, decl, tech, options) {
    const config = options.config || bemConfig();

    // Получаем слепок файловой структуры с уровней
    const introspection = await introspectFs(sources, config);
    const graph = options.skipResolvingDependencies ? null : await buildBemGraph(introspection, sources)
    const fulldecl = options.skipResolvingDependencies ? declToEntities(decl, tech) : resolveDeps(decl, graph, tech);

    return { introspection, graph, fulldecl };
}

/**
 * Функция для получения файлов по декларации.
 *
 * Алгоритм используется следующий:
 * - Получаем слепок файловой структуры с уровней
 * - Получаем и исполняем содержимое файлов ?.deps.js (получаем набор объектов deps)
 * - Получаем граф с помощью bem-deps
 * - Сортируем по уровням и раскрываем декларацию с помощью графа
 * - Преобразуем технологии зависимостей в декларации в технологии файловой системы
 * - Формируем упорядоченный список файлов по раскрытой декларации и интроспекции
 * - Читаем файлы из списка в поток
 *
 * techAliases: {[depsTech]: fileTechs}
 *
 * @param {String[]} sources - levels to use to search files
 * @param {BemEntityName[]} decl - entities to harvest
 * @param {String} tech - desired tech
 * @param {Object} options - options
 * @param {?BemConfig} options.config - config to use instead of default .bemrc
 * @param {?Object<String, String[]>} options.techAliases - tech to aliases map to fit needs for everyone
 * @returns {Stream<Vinyl>} - Just a typical stream of gulp-like file objects
 */
function src(sources, decl, tech, options) {
    assert(Array.isArray(sources) && sources.length, 'Sources required to get some files');
    assert(Array.isArray(decl) && decl.length, 'Declaration required to harvest some entities');
    assert(tech && typeof tech === 'string', 'Tech required and should be a string to build exactly some');

    options || (options = {});
    options.techMap || (options.techMap = {});

    const techMap = Object.assign({}, options.techMap);
    Object.keys(techMap)
        .filter(t => !Array.isArray(techMap[t]))
        .forEach(t => { techMap[t] = [techMap[t]]; });

    const srcP = _getBundleInfo(sources, decl, tech, options);

    if (options.deps) {
        const stream = new Readable({objectMode: true, read() {}});

        srcP.then(({ fulldecl }) => {
            const f = v => {
                const res = {};
                v.tech && (res.tech = v.tech);
                v.entity.block && (res.block = v.entity.block);
                v.entity.elem && (res.elem = v.entity.elem);
                v.entity.mod && (res.mod = v.entity.mod.name, res.val = v.entity.mod.val); // eslint-disable-line
                return res;
            };
            stream.push(new File({
                name: '',
                path: options.deps !== true ? options.deps : 'anonymous.deps.js',
                contents: new Buffer(inspect(fulldecl.map(f),
                    {depth: null, breakLength: 100, maxArrayLength: null}))
            }));
            stream.push(null);
        })
        .catch(console.error);

        return stream;
    }

    // Формируем упорядоченный список файлов по раскрытой декларации и интроспекции
    const orderedFilesPromise = srcP.then(({ introspection, fulldecl }) => {
        // Преобразуем технологии зависимостей в декларации в технологии файловой системы
        return harvest({introspection, levels: sources, decl: fulldecl, techMap});
    });

    // Читаем файлы из списка в поток
    return filesToStream(orderedFilesPromise, options);
}

/**
 * @param {Object} opts - Options for harvester
 * @param {Array<{entity: BemEntityName, level: String, tech: String, path: String}>} opts.introspection - unordered file-entities list
 * @param {String[]} opts.levels - ordered levels' paths list
 * @param {Object<String, String[]>} [opts.techMap] - deps techs to file techs mapper
 * @param {BemCell[]} opts.decl - resolved and ordered declaration
 * @returns {Array<{entity: BemEntityName, level: String, tech: String, path: String}>} - resulting ordered file-entities list
 */
function harvest(opts) {
    const declIndex = opts.decl.reduce((res, cell, idx) => {
        res[cell.entity.id] || (res[cell.entity.id] = {});
        res[cell.entity.id][cell.tech] = idx;
        return res;
    }, {});

    const levelsPos = opts.levels.reduce((res, level, idx) => { res[level] = idx; return res; }, {});
    const techMap = opts.techMap || {};
    const fileTechToDep = Object.keys(techMap || {}).reduce((res, depTech) => {
        Array.isArray(techMap[depTech]) || (techMap[depTech] = [techMap[depTech]]);
        techMap[depTech].forEach(fileTech => {
            res[fileTech] || (res[fileTech] = []);
            res[fileTech].push(depTech);
        });
        return res;
    }, {});

    const res = [], depTechForFile = {};
    for (const file of opts.introspection) {
        if (file.tech && !fileTechToDep[file.tech] && !techMap[file.tech]) {
            techMap[file.tech] = [file.tech];
            fileTechToDep[file.tech] = [file.tech];
        }

        // Skip files with unwanted technologies
        const fileTech = fileTechToDep[file.tech];
        if (!fileTech) {
            continue;
        }

        // … and files that does not exist in declaration
        const techIndex = declIndex[file.entity.id];
        const foundTech = techIndex && fileTech.find(ft => techIndex[ft] !== undefined);
        if (!techIndex || !foundTech) {
            continue;
        }

        // … and files from other levels
        if (levelsPos[file.level] === undefined) {
            continue;
        }

        depTechForFile[file.path] = foundTech;
        res.push(file);
    }

    const techPos = Object.keys(techMap).reduce((_res, depTech) => {
        techMap[depTech].forEach((fileTech, idx) => { _res[fileTech] = idx });
        return _res;
    }, {});

    // Sort in the right order: cell.entity position in declaration,
    return res.sort((f1, f2) => {
        const f1DepTech = depTechForFile[f1.path];
        const f2DepTech = depTechForFile[f2.path];
        return f1.entity.id === f2.entity.id && f1DepTech === f2DepTech
            ? (levelsPos[f1.level] - levelsPos[f2.level]) || (techPos[f1.tech] - techPos[f2.tech])
            : declIndex[f1.entity.id][f1DepTech] - declIndex[f2.entity.id][f2DepTech];
    });
}
