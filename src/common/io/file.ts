import * as Promise from 'bluebird';
import * as fs from 'fs-extra';
import * as path from 'path';

import { FileContent } from '../content/file';
import { Exportable } from "../interface/exportable";


/**
 * A file represents a file in the file system.
 *
 * An instance is able to read the contents of the file in the fs and write content to it back.
 *
 * @export
 * @class File
 */
export class File implements FileContent, Exportable<FileContent> {

  /** @type {number} The last modification timestamp. */
  lastModified: number;

  /** @type {string} The name of the file. */
  name: string;

  /** @type {string} The path of the file. */
  path: string;

  /** @type {string} The name of the file in simple form, i.e. without any extension. */
  simpleName: string;

  /** @type {number} The size of the file, in bytes. */
  size: number;

  /** @type {string} The file type. */
  type: string;

  constructor(filePath?: string) {
    if (filePath) {
      this.path = filePath;
      let ext = path.extname(this.path);
      this.type = ext.replace('.', '');
      this.name = path.basename(this.path);
      this.simpleName = path.basename(this.path, ext);
    }
  }

  /**
   * @returns {FileContent} A JSON representation of this file.
   */
  export(): FileContent {
    return {
      lastModified: this.lastModified,
      name: this.name,
      path: this.path,
      simpleName: this.simpleName,
      size: this.size,
      type: this.type
    };
  }

  /**
   * Reads the contents from disc and resolves them.
   * @param {string} [encoding]
   * @param {boolean} [stats=false] Whether to read the file stats too
   * @returns {(Promise<string | Buffer>)}
   */
  read(encoding?: string, stats = false): Promise<string | Buffer> {
    return fs.readFile(this.path, encoding).then(re => {
      if (stats)
        return fs.stat(this.path).then((stats: fs.Stats) => {
          this.lastModified = stats.mtime.getTime();
          this.size = stats.size;
          return re;
        });
      else
        return re;
    });
  }

  /**
   * Writes the given data to disc and resolves if successful.
   * @param {*} data
   * @returns {Promise<void>}
   */
  write(data: any): Promise<void> {
    return fs.writeFile(this.path, data);
  }

}
