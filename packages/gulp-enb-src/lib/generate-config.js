'use strict';

const assert = require('assert');

const fileProviderTech = require('enb/techs/file-provider');
const bemTechs = require('enb-bem-techs');

const filesToVinylFsTech = require('./techs/files-to-vinyl-files');

module.exports = (options) => {
    const opts = options || {};
    const levels = opts.levels;

    assert(Array.isArray(levels) && levels.length, 'Levels required to get some files');
    assert(opts.bundleName, 'Bundle name required to write results');
    assert(opts.suffixes, 'Suffixes required to filter results');

    const depsTech = opts.depsTech === 'deps-old' ? bemTechs.depsOld : bemTechs.deps;
    const depsOpts = opts.depsOpts || {};

    return function(projectConfig) {
        projectConfig.node(opts.bundleName, function(nodeConfig) {
            nodeConfig.addTechs([
                [bemTechs.levels, { levels }],
                [fileProviderTech, { target: '?.bemdecl.js' }],
                [depsTech],
                [bemTechs.files]
            ]);

            if (depsOpts.sourceTech && depsOpts.destTech) {
                nodeConfig.addTechs([
                    [bemTechs.depsByTechToBemdecl, {
                        target: '?.deps-by-tech.bemdecl.js',
                        sourceTech: depsOpts.sourceTech,
                        destTech: depsOpts.destTech
                    }],
                    [bemTechs.deps, {
                        target: '?.deps-by-tech.deps.js',
                        bemdeclFile: '?.deps-by-tech.bemdecl.js'
                    }],
                    [bemTechs.files, {
                        depsFile: '?.deps-by-tech.deps.js',
                        filesTarget: '?.deps-by-tech.files',
                        dirsTarget: '?.deps-by-tech.dirs'
                    }],
                    [filesToVinylFsTech, {
                        suffixes: opts.suffixes,
                        filesTarget: '?.deps-by-tech.files',
                        dirsTarget: '?.deps-by-tech.dirs'
                    }]
                ]);
            } else {
                nodeConfig.addTech([filesToVinylFsTech, {
                    suffixes: opts.suffixes,
                    filesTarget: '?.files',
                    dirsTarget: '?.dirs'
                }]);
            }

            nodeConfig.addTargets(['?.vinyl.js']);
        });
    }
};
