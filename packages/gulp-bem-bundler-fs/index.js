'use strict';

const fs = require('fs');
const path = require('path');
const Readable = require('stream').Readable;

const glob = require('glob');
const File = require('vinyl');

module.exports = function (pattern) {
    const output = new Readable({ objectMode: true });

    output._read = function () {};

    new Promise((resolve, reject) => {
        glob(pattern, (err, matches) => {
            if (err) {
                return reject(err);
            }

            resolve(matches.filter((dirname) => {
                const basename = path.basename(dirname);

                return basename.charAt(0) !== '.';
            }));
        });
    })
    .then(dirnames => {
        return Promise.all(
            dirnames.map(dirname => {
                var bundle = {
                    path: dirname,
                    levels: []
                };

                return new Promise((resolve, reject) => {
                    fs.readdir(dirname, (err, filenames) => {
                        if (err) {
                            return reject(err);
                        }

                        const hasLevel = filenames.some(filename => filename === 'blocks');
                        const bemjsonFilename = filenames.filter(filename => {
                            const suffix = filename.split('.').slice(1).join('.');

                            return suffix === 'bemjson.js';
                        })[0];
                        const bemdeclFilename = filenames.filter(filename => {
                            const suffix = filename.split('.').slice(1).join('.');

                            return suffix === 'bemdecl.js';
                        })[0];

                        if (hasLevel) {
                            bundle.levels.push(path.join(dirname, 'blocks'));
                        }

                        if (bemjsonFilename) {
                            bundle.bemjson = new File({
                                base: bemjsonFilename,
                                path: path.join(dirname, bemjsonFilename)
                            });
                        } else if (bemdeclFilename) {
                            bundle.bemdecl = new File({
                                base: bemdeclFilename,
                                path: path.join(dirname, bemdeclFilename)
                            });
                        }

                        output.push(bundle);
                    });
                });
            })
        )
    })
    .catch(err => {
        output.emit(err)
    })
    .then(() => output.push(null))

    return output;
};
