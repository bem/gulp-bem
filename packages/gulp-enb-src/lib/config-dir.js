'use strict';

const fs = require('fs');
const path = require('path');
const process = require('process');

const promisify = require('es6-promisify');
const mkdirp = promisify(require('mkdirp'));
const readdir = promisify(fs.readdir);

const DEFAULT_DIR = '.enb';
const OUTDATED_DIR = '.bem';
const cwd = process.cwd();

exports.find = (options) => {
    const defaults = { root: cwd };
    const opts = Object.assign(defaults, options);

    return readdir(opts.root)
        .then(files => {
            const confDir = files.find(dir => dir === DEFAULT_DIR) || files.find(dir => dir === OUTDATED_DIR);

            return confDir && path.join(opts.root, confDir);
        });
};

exports.get = (options) => {
    const defaults = { root: cwd };
    const opts = Object.assign(defaults, options);

    return exports.find(opts)
        .then(configDir => {
            if (configDir) {
                return configDir;
            }

            const dirname = path.join(opts.root, DEFAULT_DIR);

            return mkdirp(dirname).then(() => dirname);
        });
};
