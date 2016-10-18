'use strict';

const fs = require('fs');

const promisify = require('es6-promisify');
const enb = require('enb');

const writeFile = promisify(fs.writeFile);

module.exports = enb.buildFlow.create()
    .name('files-to-vinyl-files')
    .target('target', '?.vinyl.js')
    .defineRequiredOption('suffixes')
    .useSourceResult('filesTarget', '?.files')
    .useSourceResult('dirsTarget', '?.dirs')
    .builder(function (fileList, dirList) {
        const node = this.node;
        const root = node.getRootDir();
        const base = node.getDir();

        const files = fileList.getBySuffix(this._suffixes);
        const dirs = dirList.getBySuffix(this._suffixes);
        console.log(this._suffixes)
        const toVinyl = (file) => ({
            cwd: root,
            base: base,
            path: file.fullname
        });

        const vinylFiles = [].concat(files, dirs).map(toVinyl);

        return JSON.stringify(vinylFiles);
    })
    .saver(function (filename, contents) {
        return writeFile(filename, `module.exports = ${contents};`);
    })
    .createTech();
