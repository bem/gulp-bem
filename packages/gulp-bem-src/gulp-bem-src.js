'use strict';

const assert = require('assert');
const path = require('path');
const inspect = require('util').inspect;
const Readable = require('stream').Readable;

const BemCell = require('@bem/sdk.cell');
const bemConfig = require('@bem/sdk.config');
const walk = require('@bem/sdk.walk');
const File = require('vinyl');
const toArray = require('stream-to-array');
const read = require('gulp-read');
const bubbleStreamError = require('bubble-stream-error');

const deps = require('@bem/sdk.deps');

module.exports = src;

src.filesToStream = filesToStream;
src.harvest = harvest;

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

    const config = options.config || bemConfig();

    const techMap = Object.assign({}, options.techMap);
    Object.keys(techMap)
        .filter(t => !Array.isArray(techMap[t]))
        .forEach(t => { techMap[t] = [techMap[t]]; });

    // Получаем слепок файловой структуры с уровней
    const introspectionP = Promise.resolve(config.levelMap ? config.levelMap() : {})
        .then(levelMap => {
            const intro = walk(sources, {levels: levelMap});

            let hasSomeData = false;
            intro.on('data', () => { hasSomeData = true; });
            return new Promise((resolve, reject) => {
                setTimeout(() => hasSomeData ||
                    reject('Looks like there are no files. ' +
                        'See also https://github.com/bem-sdk/bem-walk/issues/76'), 1000);
                toArray(intro).then(resolve).catch(reject);
            });
        });

    // Получаем и исполняем содержимое файлов ?.deps.js (получаем набор объектов deps)
    const depsData = options.skipResolvingDependencies ? null : introspectionP
        .then(files => files
            // Получаем deps.js
            .filter(f => f.tech === 'deps.js')
            // Сортируем по уровням
            .sort((f1, f2) => (sources.indexOf(f1.level) - sources.indexOf(f2.level))))
        // Читаем и исполняем
        .then(deps.read())
        .then(deps.parse());

    // Получаем граф с помощью bem-deps
    const graphP = options.skipResolvingDependencies ? null : depsData.then(deps.buildGraph);

    // Раскрываем декларацию с помощью графа
    const filedeclP = (options.skipResolvingDependencies
        ? Promise.resolve(decl.map(entity => {
            var e = entity.valueOf();
            entity = typeof e === 'object' ? e : entity;
            return Object.assign({}, entity, { tech });
        }))
        : graphP.then(graph => graph.dependenciesOf(decl, tech)))
            .then(entities => entities.map(BemCell.create));

    if (options.deps) {
        const stream = new Readable({objectMode: true, read() {}});
        filedeclP.then(fulldecl => {
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
    const orderedFilesPromise = Promise.all([introspectionP, filedeclP])
        .then(data => {
            const introspection = data[0];
            const filedecl = data[1];

            // Преобразуем технологии зависимостей в декларации в технологии файловой системы
            return harvest({introspection, levels: sources, decl: filedecl, techMap});
        });

    // Читаем файлы из списка в поток
    return filesToStream(orderedFilesPromise, options);
}

/**
 * @param {BemFile[]|Promise<BemFile[]>} filesPromise - result of previous step © cap obv
 * @param {Object} options - see src options
 * @returns {Stream<Vinyl>}
 */
function filesToStream(filesPromise, options) {
    let files = null, i;
    const stream = new Readable({
        objectMode: true,
        read() {
            if (files) {
                return tryread(this);
            }

            Promise.resolve(filesPromise).then(files_ => {
                i = 0;
                files = files_;
                tryread(this);
            });

            function tryread(self) {
                try {
                    _read.call(self);
                } catch (e) {
                    self.emit('error', e);
                    self.push(null);
                }
            }
        }
    });

    function _read() {
        if (!files.length) {
            return this.push(null);
        }

        for (; i < files.length; ) { // eslint-disable-line
            const file = files[i++];
            const vf = new File({
                name: '',
                base: file.level,
                path: file.path,
                contents: null
            });

            vf.name = path.basename(file.path).split('.')[0];
            vf.level = file.level;
            vf.cell = file.cell;
            vf.entity = file.entity;
            vf.layer = file.layer;
            vf.tech = file.tech;

            if (this.push(vf) === false) { return; }
        }
        this.push(null);
    }

    options = Object.assign({
        read: true
    }, options);

    let result = stream;

    if (options.read) {
        const reader = read();
        bubbleStreamError(stream, reader);
        result = stream.pipe(reader);
    }

    return result;
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
