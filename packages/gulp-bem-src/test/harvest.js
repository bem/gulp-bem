const BemEntityName = require('@bem/entity-name');
const BemNaming = require('bem-naming');
const path = require('path');
const chai = require('chai');
const lib = require('../');

chai.should();

describe('harvest', function() {
it('should filter introspection by entity and tech', function() {
    checkHarvest({
        files: ['l1/b2/b2.js', 'l1/b2/b2.css', 'l1/b3/b3.js'],
        levels: ['l1'],
        decl: ['b2.css'],
        result: ['l1/b2/b2.css']
    });
});

it('should filter introspection by level, entity and tech', function() {
    checkHarvest({
        files: ['l1/b1/b1.js', 'l1/b2/b2.js', 'l1/b2/b2.css', 'l2/b2/b2.css', 'l1/b3/b3.js'],
        levels: ['l1'],
        decl: ['b2.css'],
        result: ['l1/b2/b2.css']
    });
});

it('should filter introspection and sort by level', function() {
    checkHarvest({
        files: ['l1/b1/b1.js', 'l1/b2/b2.css', 'l2/b2/b2.css', 'l1/b3/b3.js'],
        levels: ['l2', 'l1'],
        decl: ['b2.css'],
        result: ['l2/b2/b2.css', 'l1/b2/b2.css']
    });
});

it('should filter introspection by few declarations', function() {
    checkHarvest({
        files: ['l1/b1/b1.js', 'l1/b2/b2.css', 'l2/b2/b2.css', 'l1/b3/b3.js'],
        levels: ['l1'],
        decl: ['b1.js', 'b2.css'],
        result: ['l1/b1/b1.js', 'l1/b2/b2.css']
    });
});

it('should filter introspection and sort by level for few declarations', function() {
    checkHarvest({
        files: ['l1/b1/b1.js', 'l4/b2/b2.css', 'l1/b2/b2.css', 'l3/b2/b2.css', 'l2/b2/b2.css', 'l2/b3/b3.js'],
        levels: ['l3', 'l2', 'l1', 'l4'],
        decl: ['b1.js', 'b2.css', 'b3.js'],
        result: ['l1/b1/b1.js', 'l3/b2/b2.css', 'l2/b2/b2.css', 'l1/b2/b2.css', 'l4/b2/b2.css', 'l2/b3/b3.js']
    });
});

it('should resolve techs usign techMap with right order', function() {
    checkHarvest({
        files: ['l1/b1/b1.js', 'l2/b1/b1.vanilla.js', 'l3/b1/b1.js', 'l4/b1/b1.vanilla.js'],
        levels: ['l3', 'l2', 'l1', 'l4'],
        decl: ['b1.js'],
        techMap: {js: ['js', 'vanilla.js']},
        result: ['l3/b1/b1.js', 'l2/b1/b1.vanilla.js', 'l1/b1/b1.js', 'l4/b1/b1.vanilla.js']
    });
});

it('should include only techs that exists in techMap', function() {
    checkHarvest({
        files: ['l1/b1/b1.js', 'l2/b1/b1.vanilla.js', 'l3/b1/b1.js', 'l4/b1/b1.vanilla.js'],
        levels: ['l3', 'l2', 'l1', 'l4'],
        decl: ['b1.js'],
        techMap: {js: ['vanilla.js']},
        result: ['l2/b1/b1.vanilla.js', 'l4/b1/b1.vanilla.js']
    });
});

it('should correctly sort same entities with different techs', function() {
    checkHarvest({
        files: ['l1/b1/b1.js', 'l1/b2/b2.js', 'l1/b1/b1.styl', 'l1/b2/b2.styl'],
        levels: ['l1'],
        decl: ['b1.js', 'b2.css', 'b1.css', 'b2.js'],
        techMap: {css: 'styl'},
        result: ['l1/b1/b1.js', 'l1/b2/b2.styl', 'l1/b1/b1.styl', 'l1/b2/b2.js']
    });
});
});

// ['b1/b1.js', 'b2/b2.js', 'b3/b3.js']
// {entity: {block: 'button'}, tech: 'css'}

function checkHarvest(opts) {
    opts.introspection = opts.files.map(makeFileEntity);
    opts.result = opts.result.map(makeFileEntity);
    opts.decl = opts.decl.map(makeEntity);

    lib.harvest(opts).map(normalize)
        .should.eql(opts.result.map(normalize));
}

function makeFileEntity(filepath) {
    const level = filepath.split('/')[0];
    const tech = path.basename(filepath).split('.').slice(1).join('.');
    const entityName = path.basename(filepath).split('.')[0];
    const entity = new BemEntityName(BemNaming.parse(entityName));
    return {entity, level, tech, path: filepath};
}
function makeEntity(str) {
    str = str.split('.');
    const entityName = str[0];
    const tech = str[1];
    const entity = new BemEntityName(BemNaming.parse(entityName));
    return {entity, tech};
}
function normalize(fileEntity) {
    fileEntity.entity = '[object BemEntityName:' + fileEntity.entity.id + ']';
    return fileEntity;
}
