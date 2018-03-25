'use strict';

const path = require('path');
const Readable = require('stream').Readable;

const File = require('vinyl');
const read = require('gulp-read');
const bubbleStreamError = require('bubble-stream-error');

/**
 * @param {BemFile[]|Promise<BemFile[]>} filesPromise - result of previous step © cap obv
 * @param {Object} options - see src options
 * @returns {Stream<Vinyl>}
 */
module.exports = (filesPromise, options) => {
    let files = null, i;
    const stream = new Readable({
        objectMode: true,
        read() {
            if (files) {
                return tryread(this);
            }

            Promise.resolve(filesPromise).then(files_ => {
                i = 0;
                files = files_;
                tryread(this);
            });

            function tryread(self) {
                try {
                    _read.call(self);
                } catch (e) {
                    self.emit('error', e);
                    self.push(null);
                }
            }
        }
    });

    function _read() {
        if (!files.length) {
            return this.push(null);
        }

        for (; i < files.length; ) { // eslint-disable-line
            const file = files[i++];
            const vf = new File({
                name: '',
                base: file.level,
                path: file.path,
                contents: null
            });

            vf.name = path.basename(file.path).split('.')[0];
            vf.level = file.level;
            vf.cell = file.cell;
            vf.entity = file.entity;
            vf.layer = file.layer;
            vf.tech = file.tech;

            if (this.push(vf) === false) { return; }
        }
        this.push(null);
    }

    options = Object.assign({
        read: true
    }, options);

    let result = stream;

    if (options.read) {
        const reader = read();
        bubbleStreamError(stream, reader);
        result = stream.pipe(reader);
    }

    return result;
};
