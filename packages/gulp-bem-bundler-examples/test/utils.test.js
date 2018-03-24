'use strict';

const { expect } = require('chai');

const utils = require('../lib/utils');

describe('gulp-bem-bundler-examples (utils)', () => {
    describe('getBlockName', () => {
        it('should return resolve name of block from filename', () => {
            expect(utils.getBlockName({
                path: '/foo/bar/some-block-example.bemjson.js'
            })).to.equal('some-block-example');
        });
    });

    describe('isBemjsonFile', () => {
        it('should return true for *.bemjson.js like file name', () => {
            expect(utils.isBemjsonFile('some-block-example.bemjson.js')).not.null;
        });

        it('should return false for another files', () => {
            expect(utils.isBemjsonFile('some-block-example.css')).to.equal(null);
        });
    });

    describe('readdir', () => {
        it('should be instance of Function', () => {
            expect(utils.readdir).to.be.instanceof(Function);
        });
    });
});
