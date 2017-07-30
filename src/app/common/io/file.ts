import * as Promise from 'bluebird';
import * as fs from 'fs';
import * as path from 'path';

require('./fs');

export interface FileJSON {
  lastModified: number;
  name: string;
  path: string;
  simpleName: string;
  size: number;
  type: string;
}

/**
 * Defines a file.
 */
export class File {

  /** @type {number} lastModified Thhe last modification timestamp. */
  lastModified: number;

  /** @type {string} name The name of the file. */
  name: string;

  /** @type {string} path The path of the file. */
  path: string;

  /** @type {string} simpleName The name of the file in simple form, i.e. without any extension. */
  simpleName: string;

  /** @type {number} size The size of the file, in bytes. */
  size: number;

  /** @type {string} type The file type. */
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
   * @returns {*} A JSON representation of this file.
   */
  toJSON(): FileJSON {
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
   * @returns {(Promise<string | Buffer>)}
   */
  read(encoding?: string): Promise<string | Buffer> {
    return fs.readFileAsync(this.path, encoding);
  }

  /**
   * Writes the given data to disc and resolves if successful.
   * @param {*} data
   * @returns {Promise<void>}
   */
  write(data: any): Promise<void> {
    return fs.writeFileAsync(this.path, data);
  }
}

export default File;