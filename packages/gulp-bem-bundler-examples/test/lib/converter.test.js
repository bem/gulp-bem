'use strict';

const q = require('q');
const utils = require('../../lib/utils');
const Converter = require('../../lib/converter');

describe('Converter', () => {
    const sandbox = sinon.sandbox.create();
    let converter;

    beforeEach(() => {
        converter = new Converter();
    });

    afterEach(() => sandbox.restore());

    it('should read example directory from vinyl.path field', (done) => {
        sandbox.stub(utils, 'readdir').returns(q([]));
        converter.appendExample({path: 'foo/bar/my-block.examples'}, () => {
            expect(utils.readdir).to.be.calledWith('foo/bar/my-block.examples');
            done();
        });
    });

    it('should group example contents by example names', (done) => {
        sandbox.stub(utils, 'readdir').returns(q([
            '1-example.blocks',
            '1-example.bemjson.js',
            '2-example.blocks',
            '2-example.bemjson.js'
        ]));

        converter.appendExample({path: 'foo/bar/my-block.examples'}, () => {
            expect(converter.getResults()).to.have.length(2);
            done();
        });
    });

    it('should group bemjson and advanced example folder into bundle', (done) => {
        sandbox.stub(utils, 'readdir').returns(q([
            '1-example.blocks',
            '1-example.bemjson.js'
        ]));

        converter.appendExample({path: 'foo/bar/my-block.examples'}, () => {
            const results = converter.getResults()[0];
            expect(results.levels).to.eql([ '1-example.blocks']);
            expect(results.bemjson.history).to.eql(['my-block/1-example-examples/1-example.bemjson.js']);
            done();
        });
    });

    it('should append passed levels to entry levels', (done) => {
        converter = new Converter(['some/level/1', 'some/level/2']);

        sandbox.stub(utils, 'readdir').returns(q([
            '1-example.blocks',
            '1-example.bemjson.js'
        ]));

        converter.appendExample({path: 'foo/bar/my-block.examples'}, () => {
            const results = converter.getResults()[0];
            expect(results.levels).to.eql([
                '1-example.blocks',
                'some/level/1',
                'some/level/2'
            ]);
            done();
        });
    });
});
