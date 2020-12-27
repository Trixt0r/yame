import * as path from 'path';
import EventEmitter from '../../common/event-emitter';
import { File } from './file';
import { IExportable } from '../../common/interfaces/exportable';
import { IResource } from '../../common/interfaces/resource';

export enum ScanState {
  DONE, FAIL, NOOP
}

/**
 * A directory represents a directory in the file system.
 *
 * An instance is able to scan itself recursively and return a list of all its children.
 * The children get emptied as soon as the path gets changed. In this case the scan has to be done again.
 */
export class Directory extends EventEmitter implements IExportable<IResource<IResource[]>> {

  /**
   * Scanned children files and directories.
   */
  private _children: (File | Directory)[];

  /**
   * Whether a scan has been done on the current set path.
   */
  private scanned: boolean;

  /**
   * Cached basename.
   */
  private _name: string;

  /**
   * The uri of the directory.
   */
  uri: string;

  constructor(private pathName: string) {
    super();
    this.uri = pathName;
    this._children = [];
    this._name = path.basename(this.pathName);
    this.scanned = false;
  }

  /**
   * Recursively scans this directory for files and sub directories.
   *
   * @param [force=false]
   * @param [deep=true]
   * @return The resulting scan state
   */
  async scan(force = false, deep = true): Promise<ScanState> {
    // Skip scanning if we already scanned
    if (this.scanned && !force) return ScanState.NOOP;

    this.scanned = false;
    // Notify any listener that we are scanning now
    this.emit('scan');
    try {
      const files: string[] = await require('fs-extra').readdir(this.pathName);
      const scans: Promise<any>[] = [];
      files.forEach(filename => {
        const abs = path.resolve(this.path, filename);
        const stats = require('fs-extra').lstatSync(abs);
        if (stats.isDirectory()) {
          const dir = new Directory(abs);
          this._children.push(dir);
          this.emit('scan:dir', dir);
          if (deep) scans.push(dir.scan(force));
        } else {
          const file = new File(abs);
          this._children.push(file);
          this.emit('scan:file', file);
        }
      });
      Directory.sort(this._children);
      await Promise.all(scans);
      this.scanned = true
      this.emit('scan:done');
      return ScanState.DONE;
    } catch (e) {
      this.emit('scan:fail', e);
      return ScanState.FAIL;
    }
  }

  /**
   * Sets the path of this directory. Previously loaded files get lost.
   */
  set path(val: string) {
    this.pathName = val;
    this._children = [];
    this.scanned = false;
    this._name = path.basename(this.pathName);
    this.emit('change:path', val);
  }

  /** @type {string} path The absolute path of this directory. */
  get path(): string {
    return this.pathName;
  }

  /**
   * Copy of the files and sub directories.
   */
  get children(): (File | Directory)[] {
    return this._children.slice();
  }

  /**
   * The name of the directory without the full path.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Whether this directory has been scanned.
   */
  get isScanned(): boolean {
    return this.scanned;
  }

  /**
   * @return A JSON representation of this directory.
   */
  export(): IResource<IResource[]> {
    return {
      uri: 'file:///' +this.path,
      name: this.name,
      data: this._children.map(child => child.export()),
      type: 'directory',
      source: 'local'
    };
  }

  /**
   * Sorts the given array of files and directories alphabetically.
   * A folder will have always a lower index than a file.
   * @param children The array to sort.
   * @return The sorted list of children.
   */
  static sort(children: (Directory | File)[]): (Directory | File)[] {
    return children.sort((a: File | Directory, b: File | Directory) => {
      if (a instanceof Directory && b instanceof File) return -1;
      else if (a instanceof File && b instanceof Directory) return 1;
      else if (path.basename(a.uri).toLowerCase() <= path.basename(b.uri).toLowerCase()) return -1;
      else return 1;
    });
  }
}
