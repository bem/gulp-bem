const path = require('path');

const parseEntity = require('@bem/sdk.naming.entity.parse')(require('@bem/sdk.naming.presets/origin'));
const { assert } = require('chai');
const lib = require('..');
const Introspection = require('../lib/introspect-levels/introspection');

describe('harvest', () => {
    it('should filter introspection by entity and tech', () => {
        checkHarvest({
            files: ['l1/b2/b2.js', 'l1/b2/b2.css', 'l1/b3/b3.js'],
            levels: ['l1'],
            decl: ['b2.css'],
            result: ['l1/b2/b2.css']
        });
    });

    it('should filter introspection by level, entity and tech', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l1/b2/b2.js', 'l1/b2/b2.css', 'l2/b2/b2.css', 'l1/b3/b3.js'],
            levels: ['l1'],
            decl: ['b2.css'],
            result: ['l1/b2/b2.css']
        });
    });

    it('should filter introspection and sort by level', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l1/b2/b2.css', 'l2/b2/b2.css', 'l1/b3/b3.js'],
            levels: ['l2', 'l1'],
            decl: ['b2.css'],
            result: ['l2/b2/b2.css', 'l1/b2/b2.css']
        });
    });

    it('should filter introspection by few declarations', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l1/b2/b2.css', 'l2/b2/b2.css', 'l1/b3/b3.js'],
            levels: ['l1'],
            decl: ['b1.js', 'b2.css'],
            result: ['l1/b1/b1.js', 'l1/b2/b2.css']
        });
    });

    it('should filter introspection and sort by level for few declarations', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l4/b2/b2.css', 'l1/b2/b2.css', 'l3/b2/b2.css', 'l2/b2/b2.css', 'l2/b3/b3.js'],
            levels: ['l3', 'l2', 'l1', 'l4'],
            decl: ['b1.js', 'b2.css', 'b3.js'],
            result: ['l1/b1/b1.js', 'l3/b2/b2.css', 'l2/b2/b2.css', 'l1/b2/b2.css', 'l4/b2/b2.css', 'l2/b3/b3.js']
        });
    });

    it('should resolve techs usign techMap with right order', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l2/b1/b1.vanilla.js', 'l3/b1/b1.js', 'l4/b1/b1.vanilla.js'],
            levels: ['l3', 'l2', 'l1', 'l4'],
            decl: ['b1.js'],
            techMap: {js: ['js', 'vanilla.js']},
            result: ['l3/b1/b1.js', 'l2/b1/b1.vanilla.js', 'l1/b1/b1.js', 'l4/b1/b1.vanilla.js']
        });
    });

    it('should include only techs that exists in techMap', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l2/b1/b1.vanilla.js', 'l3/b1/b1.js', 'l4/b1/b1.vanilla.js'],
            levels: ['l3', 'l2', 'l1', 'l4'],
            decl: ['b1.js'],
            techMap: {js: ['vanilla.js']},
            result: ['l2/b1/b1.vanilla.js', 'l4/b1/b1.vanilla.js']
        });
    });

    it('should correctly sort same entities with different techs', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l1/b2/b2.js', 'l1/b1/b1.styl', 'l1/b2/b2.styl'],
            levels: ['l1'],
            decl: ['b1.js', 'b2.css', 'b1.css', 'b2.js'],
            techMap: {css: 'styl'},
            result: ['l1/b1/b1.js', 'l1/b2/b2.styl', 'l1/b1/b1.styl', 'l1/b2/b2.js']
        });
    });

    it('should return common mapped file tech for both deps techs', () => {
        checkHarvest({
            files: ['l1/b1/b1.js', 'l1/b2/b2.js', 'l1/b1/b1.react.js', 'l1/b2/b2.react.js',
                'l1/b1/b1.vanilla.js', 'l1/b2/b2.vanilla.js'],
            levels: ['l1'],
            decl: ['b1.js', 'b2.react'],
            techMap: {js: ['vanilla.js', 'js'], react: ['vanilla.js', 'react.js']},
            result: ['l1/b1/b1.vanilla.js', 'l1/b1/b1.js', 'l1/b2/b2.vanilla.js', 'l1/b2/b2.react.js']
        });
    });
});

// ['b1/b1.js', 'b2/b2.js', 'b3/b3.js']
// {entity: {block: 'button'}, tech: 'css'}

function checkHarvest(opts) {
    const files = opts.files.map(makeFileEntity);
    const entityMap = new Map();

    for (const file of files) {
        const id = file.entity.id;
        const entityFiles = entityMap.has(id) ? entityMap.get(id) : entityMap.set(id, new Set()).get(id);

        entityFiles.add(file);
    }

    opts.introspection = new Introspection(['<level-path>'], [entityMap]);
    opts.result = opts.result.map(makeFileEntity);
    opts.decl = opts.decl.map(makeEntity);

    const harvestOpts = lib.harvest(opts).map(normalize);

    assert.deepEqual(harvestOpts, opts.result.map(normalize));
}

function makeFileEntity(filepath) {
    const level = filepath.split('/')[0];
    const parts = path.basename(filepath).split('.');
    const tech = parts.slice(1).join('.');
    const entityName = parts[0];
    const entity = parseEntity(entityName);
    return {entity, level, tech, path: filepath};
}
function makeEntity(str) {
    str = str.split('.');
    const entityName = str[0];
    const tech = str[1];
    const entity = parseEntity(entityName);
    return {entity, tech};
}
function normalize(fileEntity) {
    fileEntity.entity = '[object BemEntityName:' + fileEntity.entity.id + ']';
    return fileEntity;
}
