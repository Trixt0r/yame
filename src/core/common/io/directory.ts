import File from './file';
import EventBus from '../eventbus';

import * as Promise from 'bluebird';
import * as path from 'path';

var fs = <any>Promise.promisifyAll(require('fs'));

export class Directory extends EventBus {

    private _files: (File|Directory)[];
    // Keep a flag for whether we need to scan or not
    private _scanned: boolean;

    constructor(private pathName: string) {
        super();
        this._files = [];
        this._scanned = false;
    }

    /**
     * Recursively scans this directory for files and sub directories.
     *
     * @param {boolean} [force=false]
     * @returns {Promise<any>}
     */
    scan(force: boolean = false): Promise<any> {
        // Skip scanning if we already scanned
        if (this._scanned && !force)
            return Promise.resolve();

        this._scanned = false;
        // Notify any listener that we are scanning now
        this.trigger('scan');
        return fs.readdirAsync(this.pathName).then((files: string[]) => {

            let scans = [];

            files.forEach(filename => {
                let abs = path.resolve(this.path, filename);
                let stats = fs.lstatSync(abs);
                if (stats.isDirectory()) {
                    let dir = new Directory(abs);
                    this._files.push(dir);
                    this.trigger('scan:dir', dir);
                    dir.once('scan:done', () => this.trigger('scan:dir:done', dir) );
                    scans.push(dir.scan());
                }
                else if (stats.isFile() ){
                    let file = new File();
                    this._files.push(file);
                    file.path = abs;
                    let ext = path.extname(filename);
                    file.type = ext.replace('.', '');
                    file.name = filename;
                    this.trigger('scan:file', file);
                }
            });

            // Sort files by filename and type
            this._files.sort((a: File | Directory, b: File | Directory) => {
                if (a instanceof Directory && b instanceof File)
                    return -1;
                else if (a instanceof File && b instanceof Directory)
                    return 1;
                else if (path.basename(a.path).toLowerCase() <= path.basename(b.path).toLowerCase())
                    return -1;
                else
                    return 1;
            })

            this._scanned = true;

            return Promise.all(scans);
        })
        .then(() => this.trigger('scan:done')) // We are done
        .catch(e => this.trigger('scan:fail', e) ); // We failed
    }

    /** Sets the path of this directory. Previously loaded files get lost. */
    set path(val: string) {
        this.pathName = val;
        this._files = [];
        this._scanned = false;
        this.trigger('change:path', val);
    }

    /** @type {string} The absolute path of this directory */
    get path(): string {
        return this.pathName;
    }

    /**
     * @readonly
     * @type {((File|Directory)[])} Copy of the files and sub directories.
     */
    get files(): (File|Directory)[] {
        return this._files.slice();
    }

    /**
     * @returns {*} JSON representation of this directory
     */
    toJSON(): any {
        let arr = [];
        this._files.forEach((file: File | Directory) => {
            if (file instanceof File)
                arr.push(file);
            else
                arr.push(file.toJSON());
        });
        return {
            path: this.path,
            name: path.basename(this.path),
            files: arr
        };
    }
}

export default Directory;