'use strict';

var fs = require('fs');

var utils = require('../../lib/utils');

var sandbox;

describe('utils', function() {
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('exploreI18NFolder', function () {
        it('should return list of files in folder', function (done) {
            sandbox.stub(fs, 'readdir', function(path, callback) {
                callback(null, ['ru.js', 'en.js']);
            });
            utils.exploreI18NFolderAsync('test-path/').then(function (result) {
                expect(result).to.be.an('array');
                expect(result).to.be.deep.eq(['ru.js', 'en.js']);

                done();
            }).fail(function (err) {
                done(err);
            });
        });

        it('should return error while reading folder', function (done) {
            sandbox.stub(fs, 'readdir', function(path, callback) {
                callback(new Error('READ ERROR'));
            });
            utils.exploreI18NFolderAsync('test-path/').then(function () {
                done('should be error');
            }).fail(function (err) {
                expect(err.message).to.be.eq('READ ERROR');
                done();
            });
        });
    });

    describe('mergeKeysetsAsync', function () {
        it.only('should merge keysets successful', function () {
            var keysets = [
                {path: 'test/common.blocks/page/page.i18n/ru.js'},
                {path: 'test/desktop.blocks/page/page.i18n/ru.js'}
            ];

            utils.mergeKeysetsAsync(keysets, 'page').then(function(mergedKeyset) {
                console.log('------ START -----');
                console.log(mergedKeyset);
                console.log('------- END -------');
                expect(mergedKeyset).to.be.an('object');
            });
        });
    });
});


