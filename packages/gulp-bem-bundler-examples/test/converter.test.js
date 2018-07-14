'use strict';

const utils = require('../lib/utils');
const Converter = require('../lib/converter');
const sinon = require('sinon');
const { expect, use: chaiUse } = require('chai');

chaiUse(require("sinon-chai"));

const sandbox = sinon.createSandbox({});

describe('gulp-bem-bundler-examples (converter)', () => {
    let converter;

    beforeEach(() => converter = new Converter());

    afterEach(() => sandbox.restore());

    it('should read example directory from vinyl.path field', async () => {
        sandbox.stub(utils, 'readdir').returns(Promise.resolve([]));
        await converter.appendExample({path: 'foo/bar/my-block.examples'});

        expect(utils.readdir).have.been.calledWith('foo/bar/my-block.examples');
    });

    it('should group example contents by example names', async () => {
        sandbox.stub(utils, 'readdir').returns(Promise.resolve([
            '1-example.blocks',
            '1-example.bemjson.js',
            '2-example.blocks',
            '2-example.bemjson.js'
        ]));

        await converter.appendExample({path: 'foo/bar/my-block.examples'});

        expect(converter.getResults()).to.have.length(2);
    });

    it.skip('should group bemjson and advanced example folder into bundle', async () => {
        sandbox.stub(utils, 'readdir').returns(Promise.resolve([
            '1-example.blocks',
            '1-example.bemjson.js'
        ]));

        await converter.appendExample({path: 'foo/bar/my-block.examples'});

        const results = converter.getResults()[0];
        expect(results.levels).to.eql([ '1-example.blocks']);
        expect(results.bemjson.history).to.eql(['my-block/1-example-examples/1-example.bemjson.js']);
    });

    it('should append passed levels to entry levels', async () => {
        converter = new Converter(['some/level/1', 'some/level/2']);

        sandbox.stub(utils, 'readdir').returns(Promise.resolve([
            '1-example.blocks',
            '1-example.bemjson.js'
        ]));

        await converter.appendExample({path: 'foo/bar/my-block.examples'});

        const results = converter.getResults()[0];
        expect(results.levels).to.eql([
            '1-example.blocks',
            'some/level/1',
            'some/level/2'
        ]);
    });
});
