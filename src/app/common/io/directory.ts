import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import EventEmitter from '../event-emitter';
import File from './file';

require('./fs');

export class Directory extends EventEmitter {

  /** @type {((File | Directory)[])} Scanned children files and directories */
  private _children: (File | Directory)[];

  /** @type {boolean} scanned Whether a scan has already been done or not. */
  private scanned: boolean;

  constructor(private pathName: string) {
    super();
    this._children = [];
    this.scanned = false;
  }

  /**
   * Recursively scans this directory for files and sub directories.
   *
   * @param {boolean} [force=false]
   * @param {boolean} [deep=true]
   * @returns {Promise<any>}
   */
  scan(force: boolean = false, deep: boolean = true): Promise<any> {
    // Skip scanning if we already scanned
    if (this.scanned && !force)
      return Promise.resolve();

    this.scanned = false;
    // Notify any listener that we are scanning now
    this.emit('scan');
    return fs.readdirAsync(this.pathName)
      .then((files: string[]) => {
        let scans: Promise<any>[] = [];
        files.forEach(filename => {
          let abs = path.resolve(this.path, filename);
          let stats = fs.lstatSync(abs);
          if (stats.isDirectory()) {
              let dir = new Directory(abs);
              this._children.push(dir);
              this.emit('scan:dir', dir);
              dir.once('scan:done', () => this.emit('scan:dir:done', dir) );
              if (deep)
                scans.push(dir.scan());
          }
          else if (stats.isFile() ){
              let file = new File(abs);
              this._children.push(file);
              this.emit('scan:file', file);
          }
        });

      // Sort files by filename and type
      this._children.sort((a: File | Directory, b: File | Directory) => {
        if (a instanceof Directory && b instanceof File)
            return -1;
        else if (a instanceof File && b instanceof Directory)
            return 1;
        else if (path.basename(a.path).toLowerCase() <= path.basename(b.path).toLowerCase())
            return -1;
        else
            return 1;
      });

      return Promise.all(scans)
              .finally(() => this.scanned = true);
    })
    .then(() => this.emit('scan:done')) // We are done
    .catch(e => this.emit('scan:fail', e) ); // We failed
  }

  /** Sets the path of this directory. Previously loaded files get lost. */
  set path(val: string) {
    this.pathName = val;
    this._children = [];
    this.scanned = false;
    this.emit('change:path', val);
  }

  /** @type {string} path The absolute path of this directory. */
  get path(): string {
    return this.pathName;
  }

  /**
   * @readonly
   * @type {((File | Directory)[])} Copy of the files and sub directories.
   */
  get children(): (File | Directory)[] {
    return this._children.slice();
  }

  /**
   * @returns {*} A JSON representation of this directory.
   */
  toJSON(): any {
    return {
      path: this.path,
      name: path.basename(this.path),
      children: this._children.map(child => child.toJSON())
    };
  }
}

export default Directory;